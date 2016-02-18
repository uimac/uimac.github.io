define(function (require, exports, module) {

  'use strict';

  var TR = require('gui/GuiTR');

  var GuiCamera = function (guiParent, ctrlGui) {
    this._main = ctrlGui._main; // main application
    this._menu = null; // ui menu
    this._camera = this._main.getCamera(); // the camera
    this._cameraTimer = -1; // interval id (used for zqsd/wasd/arrow moves)
    this._cbTranslation = this.cbOnTranslation.bind(this);
    this.init(guiParent);
  };

  GuiCamera.prototype = {
    /** Initialize */
    init: function (guiParent) {
      var camera = this._camera;

      // Camera fold
      var menu = this._menu = guiParent.addMenu(TR('cameraTitle'));

      // reset camera
      menu.addTitle(TR('cameraReset'));
      menu.addDualButton(TR('cameraCenter'), TR('cameraFront'), this.resetCamera.bind(this), this.resetFront.bind(this));
      menu.addDualButton(TR('cameraLeft'), TR('cameraTop'), this.resetLeft.bind(this), this.resetTop.bind(this));

      // camera type
      var optionsType = {};
      this._ctrlProjectionTitle = menu.addTitle(TR('cameraProjection'));
      optionsType.PERSPECTIVE = TR('cameraPerspective');
      optionsType.ORTHOGRAPHIC = TR('cameraOrthographic');
      this._ctrlProjection = menu.addCombobox('', camera.getProjectionType(), this.onCameraTypeChange.bind(this), optionsType);

      // camera fov
      this._ctrlFov = menu.addSlider(TR('cameraFov'), camera.getFov(), this.onFovChange.bind(this), 10, 90, 1);
      this._ctrlFov.setVisibility(camera.getProjectionType() === 'PERSPECTIVE');

      // camera mode
      var optionsMode = {};
      menu.addTitle(TR('cameraMode'));
      optionsMode.ORBIT = TR('cameraOrbit');
      optionsMode.SPHERICAL = TR('cameraSpherical');
      optionsMode.PLANE = TR('cameraPlane');
      menu.addCombobox('', camera.getMode(), this.onCameraModeChange.bind(this), optionsMode);
      this._ctrlPivot = menu.addCheckbox(TR('cameraPivot'), camera.getUsePivot(), this.onPivotChange.bind(this));
    },
    onCameraModeChange: function (value) {
      this._camera.setMode(value);
      this._main.render();
	  setTimeout(function () {
		  window.umgl.drawonce();
	  }, 220);
    },
    onCameraTypeChange: function (value) {
      this._camera.setProjectionType(value);
      this._ctrlFov.setVisibility(value === 'PERSPECTIVE');
      this._main.render();
    },
    onFovChange: function (value) {
      this._camera.setFov(value);
      this._main.render();
    },
    onKeyDown: function (event) {
      if (event.handled === true)
        return;
      event.stopPropagation();
      if (this._main._focusGui)
        return;
      event.preventDefault();
      var key = event.which;
      var main = this._main;
      var camera = main.getCamera();
      event.handled = true;
      if (event.shiftKey && main._action === 'CAMERA_ROTATE') {
        camera.snapClosestRotation();
        main.render();
      }
      switch (key) {
      case 37: // LEFT
        camera._moveX = -1;
        break;
      case 39: // RIGHT
        camera._moveX = 1;
        break;
      case 38: // UP
        camera._moveZ = -1;
        break;
      case 40: // DOWN
        camera._moveZ = 1;
        break;
      default:
        event.handled = false;
      }
      if (event.handled === true && this._cameraTimer === -1) {
        this._cameraTimer = window.setInterval(this._cbTranslation, 16.6);
      }
    },
    cbOnTranslation: function () {
      var main = this._main;
      main.getCamera().updateTranslation();
      main.render();
    },
    /** Key released event */
    onKeyUp: function (event) {
      if (event.handled === true)
        return;
      event.stopPropagation();
      if (this._main._focusGui)
        return;
      event.preventDefault();
      event.handled = true;
      var key = event.which;
      var camera = this._camera;
      switch (key) {
      case 37: // LEFT
      case 39: // RIGHT
        camera._moveX = 0;
        break;
      case 38: // UP
      case 40: // DOWN
        camera._moveZ = 0;
        break;
      case 32: // SPACE
        this.resetCamera();
        break;
      case 70: // F
        this.resetFront();
        break;
      case 84: // T
        this.resetTop();
        break;
      case 76: // L
        this.resetLeft();
        break;
      }
      if (this._cameraTimer !== -1 && camera._moveX === 0 && camera._moveZ === 0) {
        clearInterval(this._cameraTimer);
        this._cameraTimer = -1;
      }
    },
    resetCamera: function () {
      this._camera.resetView();
      this._main.render();
	  setTimeout(function () {
		  window.umgl.drawonce();
	  }, 220);
    },
    resetFront: function () {
      this._camera.toggleViewFront();
      this._main.render();
	  setTimeout(function () {
		  window.umgl.drawonce();
	  }, 220);
    },
    resetLeft: function () {
      this._camera.toggleViewLeft();
      this._main.render();
	  setTimeout(function () {
		  window.umgl.drawonce();
	  }, 220);
    },
    resetTop: function () {
      this._camera.toggleViewTop();
      this._main.render();
	  setTimeout(function () {
		  window.umgl.drawonce();
	  }, 220);
    },
    onPivotChange: function () {
      this._camera.toggleUsePivot();
      this._main.render();
    }
  };

  module.exports = GuiCamera;
});
