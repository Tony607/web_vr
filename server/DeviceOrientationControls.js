/**
 * DeviceOrientationControls - applies device orientation on object rotation
 *
 * @param {Object} object - instance of THREE.Object3D
 * @constructor
 *
 * @author richt / http://richt.me
 * @author WestLangley / http://github.com/WestLangley
 * @author jonobr1 / http://jonobr1.com
 * @author arodic / http://aleksandarrodic.com
 * @author doug / http://github.com/doug
 *
 * W3C Device Orientation control
 * (http://w3c.github.io/deviceorientation/spec-source-orientation.html)
 */

var THREE = require("three");
THREE.DeviceOrientationControls = function(object) {

  this.object = object;

  this.object.rotation.reorder('YXZ');

  this.freeze = true;

  this.movementSpeed = 1.0;
  this.rollSpeed = 0.005;
  this.autoAlign = true;
  this.autoForward = false;

  this.alpha = 0;
  this.beta = 0;
  this.gamma = 0;
  this.orient = 0;

  this.alignQuaternion = new THREE.Quaternion();
  this.orientationQuaternion = new THREE.Quaternion();

  var quaternion = new THREE.Quaternion();
  var quaternionLerp = new THREE.Quaternion();

  var tempVector3 = new THREE.Vector3();
  var tempMatrix4 = new THREE.Matrix4();
  var tempEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  var tempQuaternion = new THREE.Quaternion();

  var zee = new THREE.Vector3(0, 0, 1);
  var up = new THREE.Vector3(0, 1, 0);
  var v0 = new THREE.Vector3(0, 0, 0);
  var euler = new THREE.Euler();
  var q0 = new THREE.Quaternion(); // - PI/2 around the x-axis
  var q1 = new THREE.Quaternion(- Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));

  this.deviceOrientation = {};
  this.screenOrientation = 90 || 0;

    // this returns 90 if width is greater then height 
    // and window orientation is undefined OR 0
    // if (!window.orientation && window.innerWidth > window.innerHeight)
    //   return 90;
    return 90 || 0;
  };


  this.update = function(rawEvtData) {
    this.deviceOrientation = rawEvtData;
    return function() {

      if (this.freeze) return;

      // should not need this
      var orientation = 90; //landscape-primary
      if (orientation !== this.screenOrientation) {
        this.screenOrientation = orientation;
        this.autoAlign = true;
      }

      this.alpha = this.deviceOrientation.gamma ?
        THREE.Math.degToRad(this.deviceOrientation.alpha) : 0; // Z
      this.beta = this.deviceOrientation.beta ?
        THREE.Math.degToRad(this.deviceOrientation.beta) : 0; // X'
      this.gamma = this.deviceOrientation.gamma ?
        THREE.Math.degToRad(this.deviceOrientation.gamma) : 0; // Y''
      this.orient = this.screenOrientation ?
        THREE.Math.degToRad(this.screenOrientation) : 0; // O

      // The angles alpha, beta and gamma
      // form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''

      // 'ZXY' for the device, but 'YXZ' for us
      euler.set(this.beta, this.alpha, - this.gamma, 'YXZ');

      quaternion.setFromEuler(euler);
      quaternionLerp.slerp(quaternion, 0.5); // interpolate

      // orient the device
      if (this.autoAlign) this.orientationQuaternion.copy(quaternion); // interpolation breaks the auto alignment
      else this.orientationQuaternion.copy(quaternionLerp);

      // camera looks out the back of the device, not the top
      this.orientationQuaternion.multiply(q1);

      // adjust for screen orientation
      this.orientationQuaternion.multiply(q0.setFromAxisAngle(zee, - this.orient));

      this.object.quaternion.copy(this.alignQuaternion);
      this.object.quaternion.multiply(this.orientationQuaternion);

      if (this.autoForward) {

        tempVector3
          .set(0, 0, -1)
          .applyQuaternion(this.object.quaternion, 'ZXY')
          .setLength(this.movementSpeed / 50); // TODO: why 50 :S

        this.object.position.add(tempVector3);

      }

      if (this.autoAlign && this.alpha !== 0) {

        this.autoAlign = false;

        this.align();

      }

    };

  }();

  // //debug
  // window.addEventListener('click', (function(){
  //   this.align();
  // }).bind(this)); 

  this.align = function() {

    tempVector3
      .set(0, 0, -1)
      .applyQuaternion( tempQuaternion.copy(this.orientationQuaternion).inverse(), 'ZXY' );

    tempEuler.setFromQuaternion(
      tempQuaternion.setFromRotationMatrix(
        tempMatrix4.lookAt(tempVector3, v0, up)
     )
   );

    tempEuler.set(0, tempEuler.y, 0);
    this.alignQuaternion.setFromEuler(tempEuler);

  };


