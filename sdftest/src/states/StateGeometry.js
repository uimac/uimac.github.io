define(function (require, exports, module) {

  'use strict';

  var glm = require('lib/glMatrix');
  var Utils = require('misc/Utils');

  var vec3 = glm.vec3;

  var StateGeometry = function (main, mesh) {
    this._main = main; // main application
    this._mesh = mesh; // the mesh
    this._center = vec3.copy([0.0, 0.0, 0.0], mesh.getCenter());

    this._idVertState = []; // ids of vertices
    this._vArState = []; // copies of vertices coordinates
  };

  StateGeometry.prototype = {
    isNoop: function () {
      return this._idVertState.length === 0;
    },
    undo: function (skipUpdate) {
      this.pullVertices();
      if (skipUpdate) return;
      var mesh = this._mesh;
      mesh.updateGeometry(mesh.getFacesFromVertices(this._idVertState), this._idVertState);
      mesh.updateGeometryBuffers();
      vec3.copy(mesh.getCenter(), this._center);
      this._main.setMesh(mesh);
    },
    redo: function () {
      this.undo();
    },
    createRedo: function () {
      var redo = new StateGeometry(this._main, this._mesh);
      this.pushRedoVertices(redo);
      return redo;
    },
    pushVertices: function (iVerts) {
      var idVertState = this._idVertState;
      var vArState = this._vArState;

      var mesh = this._mesh;
      var vAr = mesh.getVertices();
      var vertStateFlags = mesh.getVerticesStateFlags();

      var stateFlag = Utils.STATE_FLAG;
      var nbVerts = iVerts.length;
      for (var i = 0; i < nbVerts; ++i) {
        var id = iVerts[i];
        if (vertStateFlags[id] === stateFlag)
          continue;
        vertStateFlags[id] = stateFlag;
        idVertState.push(id);
        id *= 3;
        vArState.push(vAr[id], vAr[id + 1], vAr[id + 2]);
      }
    },
    pushRedoVertices: function (redoState) {
      var mesh = redoState._mesh;
      var vAr = mesh.getVertices();

      var idVertUndoState = this._idVertState;
      var nbVerts = idVertUndoState.length;

      var vArRedoState = redoState._vArState = new Float32Array(nbVerts * 3);
      var idVertRedoState = redoState._idVertState = new Uint32Array(nbVerts);
      for (var i = 0; i < nbVerts; ++i) {
        var id = idVertRedoState[i] = idVertUndoState[i];
        id *= 3;
        var j = i * 3;
        vArRedoState[j] = vAr[id];
        vArRedoState[j + 1] = vAr[id + 1];
        vArRedoState[j + 2] = vAr[id + 2];
      }
    },
    pullVertices: function () {
      var vArState = this._vArState;
      var idVertState = this._idVertState;
      var nbVerts = idVertState.length;

      var mesh = this._mesh;
      var vAr = mesh.getVertices();
      for (var i = 0; i < nbVerts; ++i) {
        var id = idVertState[i] * 3;
        var j = i * 3;
        vAr[id] = vArState[j];
        vAr[id + 1] = vArState[j + 1];
        vAr[id + 2] = vArState[j + 2];
      }
    }
  };

  module.exports = StateGeometry;
});