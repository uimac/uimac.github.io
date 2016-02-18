define(function (require, exports, module) {

  'use strict';

  var Mesh = require('mesh/Mesh');
  var Utils = require('misc/Utils');

  var Import = {};

  var typeToOctet = function (type) {
    switch (type) {
    case 'uchar':
    case 'char':
    case 'int8':
    case 'uint8':
      return 1;
    case 'ushort':
    case 'short':
    case 'int16':
    case 'uint16':
      return 2;
    case 'uint':
    case 'int':
    case 'float':
    case 'int32':
    case 'uint32':
    case 'float32':
      return 4;
    case 'double':
    case 'float64':
      return 8;
    default:
      return 0;
    }
  };

  var getParseFunc = function (type, isFloat) {
    var fac = isFloat ? 1.0 / 255.0 : 1;
    switch (type) {
    case 'char':
    case 'uchar':
    case 'short':
    case 'ushort':
    case 'int':
    case 'uint':
    case 'int8':
    case 'uint8':
    case 'int16':
    case 'uint16':
    case 'int32':
    case 'uint32':
      return function (n) {
        return parseInt(n, 10) * fac;
      };
    case 'float':
    case 'double':
    case 'float32':
    case 'float64':
      return parseFloat;
    default:
      return function (n) {
        return n;
      };
    }
  };

  var getBinaryRead = function (dview, prop, isFloat) {
    var fac = isFloat ? 1.0 / 255.0 : 1;
    var offset = prop.offsetOctet;
    switch (prop.type) {
    case 'int8':
    case 'char':
      return function (off) {
        return dview.getInt8(off + offset) * fac;
      };
    case 'uint8':
    case 'uchar':
      return function (off) {
        return dview.getUint8(off + offset) * fac;
      };
    case 'int16':
    case 'short':
      return function (off) {
        return dview.getInt16(off + offset, true) * fac;
      };
    case 'uint16':
    case 'ushort':
      return function (off) {
        return dview.getUint16(off + offset, true) * fac;
      };
    case 'int32':
    case 'int':
      return function (off) {
        return dview.getInt32(off + offset, true) * fac;
      };
    case 'uint32':
    case 'uint':
      return function (off) {
        return dview.getUint32(off + offset, true) * fac;
      };
    case 'float32':
    case 'float':
      return function (off) {
        return dview.getFloat32(off + offset, true);
      };
    case 'float64':
    case 'double':
      return function (off) {
        return dview.getFloat64(off + offset, true);
      };
    }
  };

  var readHeader = function (buffer) {
    var data = Utils.ab2str(buffer);
    var lines = data.split('\n');

    var infos = {
      isBinary: false,
      start: 0,
      elements: [],
      lines: lines,
      buffer: buffer,
      vertices: null,
      faces: null,
      colors: null,
      offsetLine: 0,
      offsetOctet: 0
    };

    var i = 0;
    var split;

    while (true) {
      var line = lines[i++];
      infos.offsetOctet += line.length + 1;
      infos.offsetLine = i;

      line = line.trim();

      if (line.startsWith('format binary')) {
        infos.isBinary = true;

      } else if (line.startsWith('element')) {

        split = line.split(/\s+/);
        infos.elements.push({
          name: split[1],
          count: parseInt(split[2], 10),
          properties: []
        });

      } else if (line.startsWith('property')) {

        split = line.split(/\s+/);
        var isList = split[1] === 'list';
        infos.elements[infos.elements.length - 1].properties.push({
          type: split[isList ? 2 : 1],
          type2: isList ? split[3] : undefined,
          name: split[isList ? 4 : 2]
        });

      } else if (line.startsWith('end_header')) {

        break;
      }
    }

    return infos;
  };

  ///////////////
  // READ VERTEX
  ///////////////
  var cleanVertexElement = function (element, infos) {
    var props = element.properties;
    var objProperties = element.objProperties = {};
    element.offsetOctet = 0;

    for (var i = 0, nbProps = props.length; i < nbProps; ++i) {
      var prop = props[i];
      var objProp = objProperties[prop.name] = {};
      objProp.type = prop.type;
      if (infos.isBinary) {
        objProp.offsetOctet = element.offsetOctet;
        element.offsetOctet += typeToOctet(prop.type);
      } else {
        objProp.id = i;
      }
    }
  };

  var readAsciiVertex = function (element, infos, vAr, cAr) {

    var count = element.count;
    var lines = infos.lines;
    var props = element.objProperties;
    var offsetLine = infos.offsetLine;

    var parseX = getParseFunc(props.x.type, true);
    var parseY = getParseFunc(props.y.type, true);
    var parseZ = getParseFunc(props.z.type, true);

    var parseR, parseG, parseB;
    if (props.red) parseR = getParseFunc(props.red.type, true);
    if (props.green) parseG = getParseFunc(props.green.type, true);
    if (props.blue) parseB = getParseFunc(props.blue.type, true);

    for (var i = 0; i < count; ++i) {
      var id = i * 3;
      var split = lines[offsetLine + i].trim().split(/\s+/);
      vAr[id] = parseX(split[props.x.id]);
      vAr[id + 1] = parseY(split[props.y.id]);
      vAr[id + 2] = parseZ(split[props.z.id]);
      if (parseR) cAr[id] = parseR(split[props.red.id]);
      if (parseG) cAr[id + 1] = parseG(split[props.green.id]);
      if (parseB) cAr[id + 2] = parseB(split[props.blue.id]);
    }

    infos.offsetLine += count;
  };

  var readBinaryVertex = function (element, infos, vAr, cAr) {
    var count = element.count;
    var props = element.objProperties;
    var offsetOctet = element.offsetOctet;
    var lenOctet = offsetOctet * count;

    var dview = new DataView(infos.buffer, infos.offsetOctet, lenOctet);
    var readX = getBinaryRead(dview, props.x, true);
    var readY = getBinaryRead(dview, props.y, true);
    var readZ = getBinaryRead(dview, props.z, true);

    var readR, readG, readB;
    if (props.red) readR = getBinaryRead(dview, props.red, true);
    if (props.green) readG = getBinaryRead(dview, props.green, true);
    if (props.blue) readB = getBinaryRead(dview, props.blue, true);

    for (var i = 0; i < count; ++i) {
      var id = i * 3;
      var offset = i * offsetOctet;

      vAr[id] = readX(offset);
      vAr[id + 1] = readY(offset);
      vAr[id + 2] = readZ(offset);
      if (readR) cAr[id] = readR(offset);
      if (readG) cAr[id + 1] = readG(offset);
      if (readB) cAr[id + 2] = readB(offset);
    }

    infos.offsetOctet += lenOctet;
  };

  var readElementVertex = function (element, infos) {

    cleanVertexElement(element, infos);

    var vAr = infos.vertices = new Float32Array(element.count * 3);
    var cAr;
    var props = element.objProperties;
    if (props.red || props.green || props.blue)
      cAr = infos.colors = new Float32Array(element.count * 3);

    if (!infos.isBinary)
      readAsciiVertex(element, infos, vAr, cAr);
    else
      readBinaryVertex(element, infos, vAr, cAr);
  };

  /////////////
  // READ INDEX
  /////////////
  var readAsciiIndex = function (element, infos, fAr) {

    var count = element.count;
    var lines = infos.lines;
    var offsetLine = infos.offsetLine;
    var obj = element.properties[0];

    var parseCount = getParseFunc(obj.type);
    var parseIndex = getParseFunc(obj.type2);

    var idFace = 0;
    for (var i = 0; i < count; ++i) {
      var split = lines[offsetLine + i].trim().split(/\s+/);
      var nbVert = parseCount(split[0]);
      if (nbVert !== 3 && nbVert !== 4)
        continue;

      fAr[idFace] = parseIndex(split[1]);
      fAr[idFace + 1] = parseIndex(split[2]);
      fAr[idFace + 2] = parseIndex(split[3]);
      fAr[idFace + 3] = nbVert === 4 ? parseIndex(split[4]) : -1;
      idFace += 4;
    }

    infos.offsetLine += count;
  };

  var readBinaryIndex = function (element, infos, fAr) {
    var count = element.count;
    var obj = element.properties[0];

    var dview = new DataView(infos.buffer, infos.offsetOctet);
    var readCount = getBinaryRead(dview, {
      type: obj.type,
      offsetOctet: 0
    });

    var readIndex = getBinaryRead(dview, {
      type: obj.type2,
      offsetOctet: 0
    });

    var offsetCurrent = 0;

    var nbOctetCount = typeToOctet(obj.type);
    var nbOctetIndex = typeToOctet(obj.type2);
    var idf = 0;
    for (var i = 0; i < count; ++i) {
      var nbVert = readCount(offsetCurrent);
      offsetCurrent += nbOctetCount;
      if (nbVert !== 3 && nbVert !== 4) {
        offsetCurrent += nbVert * nbOctetIndex;
        continue;
      }

      fAr[idf++] = readIndex(offsetCurrent);
      offsetCurrent += nbOctetIndex;

      fAr[idf++] = readIndex(offsetCurrent);
      offsetCurrent += nbOctetIndex;

      fAr[idf++] = readIndex(offsetCurrent);
      offsetCurrent += nbOctetIndex;

      if (nbVert === 4) {
        fAr[idf++] = readIndex(offsetCurrent);
        offsetCurrent += nbOctetIndex;
      } else {
        fAr[idf++] = -1;
      }
    }

    infos.faces = fAr.subarray(0, idf);
    infos.offsetOctet += offsetCurrent;
  };

  var readElementIndex = function (element, infos) {

    var fAr = infos.faces = new Int32Array(element.count * 4);
    if (!infos.isBinary)
      readAsciiIndex(element, infos, fAr);
    else
      readBinaryIndex(element, infos, fAr);
  };

  var skipElement = function (element, infos) {

    var count = element.count;

    if (!infos.isBinary) {

      infos.offsetLine += count;

    } else {

      var obj = element.properties[0];

      var dview = new DataView(infos.buffer, infos.offsetOctet);
      var readCount = getBinaryRead(dview, {
        type: obj.type,
        offsetOctet: 0
      });

      var offsetCurrent = 0;
      var nbOctetCount = typeToOctet(obj.type);
      var nbOctetIndex = typeToOctet(obj.type2);
      for (var i = 0; i < count; ++i) {
        offsetCurrent += nbOctetCount + readCount(offsetCurrent) * nbOctetIndex;
      }

      infos.offsetOctet += offsetCurrent;
    }

  };

  Import.importPLY = function (buffer, gl) {

    var infos = readHeader(buffer);
    var elements = infos.elements;

    for (var i = 0, nbElts = elements.length; i < nbElts; ++i) {

      var element = elements[i];

      if (element.name === 'vertex') {
        readElementVertex(element, infos);
      } else if (element.name === 'face') {
        readElementIndex(element, infos);
      } else {
        skipElement(element, infos);
      }
    }

    var mesh = new Mesh(gl);
    mesh.setVertices(infos.vertices);
    mesh.setFaces(infos.faces);
    mesh.setColors(infos.colors);
    return [mesh];
  };

  module.exports = Import;
});