var THREE = require("three");
function OrientationProcessor() {
	var scope = this;
	var radtoDeg = 180 / Math.PI;
	var deviceQuat = new THREE.Quaternion();


	var servoOffsets = [0x59, 0x49, 0x45];
	var servoDirections = [-1, -1, 1];
	//the clamp unit for each servo
	var servoLimits = [[0x18,0xA7],[0x02, 0x95],[0x06,0x90]];
	var clamp = function(num, min, max) {
	    return num < min ? min : (num > max ? max : num);
	};
	var degreePerUnit = 180.0/143.0;
	this.deviceOrientation = {alpha: 43.06647261669845, beta: -1.8509070242249999, gamma: -87.30062171830068};
	//landscape
	this.screenOrientation = 90;

	// The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''

	var createQuaternion = function () {


		var finalQuaternion = new THREE.Quaternion();

		var deviceEuler = new THREE.Euler();

		var screenTransform = new THREE.Quaternion();

		var worldTransform = new THREE.Quaternion( - Math.sqrt(0.5), 0, 0, Math.sqrt(0.5) ); // - PI/2 around the x-axis

		var minusHalfAngle = 0;

		return function ( alpha, beta, gamma, screenOrientation ) {

			deviceEuler.set( beta, alpha, - gamma, 'YXZ' );

			finalQuaternion.setFromEuler( deviceEuler );

			minusHalfAngle = - screenOrientation / 2;

			screenTransform.set( 0, Math.sin( minusHalfAngle ), 0, Math.cos( minusHalfAngle ) );

			finalQuaternion.multiply( screenTransform );

			finalQuaternion.multiply( worldTransform );

			return finalQuaternion;

		}

	}();

	this.update = function () {


		var alpha  = scope.deviceOrientation.alpha ? THREE.Math.degToRad( scope.deviceOrientation.alpha ) : 0; // Z
		var beta   = scope.deviceOrientation.beta  ? THREE.Math.degToRad( scope.deviceOrientation.beta  ) : 0; // X'
		var gamma  = scope.deviceOrientation.gamma ? THREE.Math.degToRad( scope.deviceOrientation.gamma ) : 0; // Y''
		var orient = scope.screenOrientation       ? THREE.Math.degToRad( scope.screenOrientation       ) : 0; // O
		//scope.object.quaternion
		deviceQuat = createQuaternion(alpha, beta, gamma, orient );

	};

	/**
	* Returns the yaw pitch and roll angles, respectively defined as the angles in radians between
	* the Earth North and the IMU X axis (yaw), the Earth ground plane and the IMU X axis (pitch)
	* and the Earth ground plane and the IMU Y axis.
	* 
	* @note This is not an Euler representation: the rotations aren't consecutive rotations but only
	* angles from Earth and the IMU. For Euler representation Yaw, Pitch and Roll see FreeIMU::getEuler
	* 
	* @param ypr three floats array which will be populated by Yaw, Pitch and Roll angles in radians
	*/
	this.getYawPitchRoll = function () {
		var q = [1,0,0,0]; // quaternion[w,x,y,z]
		var ypr = [0,0,0]; 
		var gx, gy, gz; // estimated gravity direction
		var q = [deviceQuat.w, 
				deviceQuat.x ,
				deviceQuat.y, 
				deviceQuat.z ];

		gx = 2 * (q[1]*q[3] - q[0]*q[2]);
		gy = 2 * (q[0]*q[1] + q[2]*q[3]);
		gz = q[0]*q[0] - q[1]*q[1] - q[2]*q[2] + q[3]*q[3];
		ypr[0] = Math.atan(gx / Math.sqrt(gy*gy + gz*gz));
		ypr[1] = Math.atan(gy / Math.sqrt(gx*gx + gz*gz));
		ypr[2] = Math.atan2(2 * q[1] * q[2] - 2 * q[0] * q[3], 2 * q[0]*q[0] + 2 * q[1] * q[1] - 1);

		ypr[0] *= radtoDeg;
		ypr[1] *= radtoDeg;
		ypr[2] *= radtoDeg;
		for (var i = 0; i < ypr.length; i++) {
			var min = servoLimits[i][0];
			var max = servoLimits[i][1];
			ypr[i] = clamp(servoDirections[i]*ypr[i]*degreePerUnit+servoOffsets[i], min, max);
			ypr[i] = ypr[i].toFixed(0);

		};

		return ypr;
	};
	this.getYawPitchRollFromDeviceQuaternion = function (quaternion) {
	
		var deviceQuaternion = new THREE.Quaternion();
		var screenTransform = new THREE.Quaternion();
		var worldTransform = new THREE.Quaternion(0,  Math.sqrt(0.5), 0, Math.sqrt(0.5) );
		
		deviceQuaternion.set( quaternion.x,quaternion.y,quaternion.z,quaternion.w );

		var minusHalfAngle = -45;//-90/2

		screenTransform.set( 0, Math.sin( minusHalfAngle ), 0, Math.cos( minusHalfAngle ) );

		//deviceQuaternion.multiply( screenTransform );

		deviceQuaternion.multiply( worldTransform );

		var q = [1,0,0,0]; // quaternion[w,x,y,z]
		var ypr = [0,0,0]; 
		var gx, gy, gz; // estimated gravity direction
		var q = [deviceQuaternion.w, 
				deviceQuaternion.x ,
				deviceQuaternion.y, 
				deviceQuaternion.z ];

		gx = 2 * (q[1]*q[3] - q[0]*q[2]);
		gy = 2 * (q[0]*q[1] + q[2]*q[3]);
		gz = q[0]*q[0] - q[1]*q[1] - q[2]*q[2] + q[3]*q[3];
		ypr[0] = Math.atan(gx / Math.sqrt(gy*gy + gz*gz));
		ypr[1] = Math.atan(gy / Math.sqrt(gx*gx + gz*gz));
		ypr[2] = Math.atan2(2 * q[1] * q[2] - 2 * q[0] * q[3], 2 * q[0]*q[0] + 2 * q[1] * q[1] - 1);

		ypr[0] *= radtoDeg;
		ypr[1] *= radtoDeg;
		ypr[2] *= radtoDeg;
		var tmp = ypr[2];
		ypr[2] = ypr[1];
		ypr[1] = ypr[0];
		ypr[0] = tmp;
		//print the angles
		console.log("angles:",ypr[0].toFixed(2),ypr[1].toFixed(2),ypr[2].toFixed(2));
		for (var i = 0; i < ypr.length; i++) {
			var min = servoLimits[i][0];
			var max = servoLimits[i][1];
			ypr[i] = clamp(servoDirections[i]*ypr[i]*degreePerUnit+servoOffsets[i], min, max);
			ypr[i] = ypr[i].toFixed(0);

		};
		return ypr;
	};

};
// export the class
module.exports = OrientationProcessor;