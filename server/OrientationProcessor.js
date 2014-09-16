var THREE = require("three");
function OrientationProcessor( object ) {
	var scope = this;
	var radtoDeg = 180 / Math.PI;
	this.object = object;

	this.object.rotation.reorder( "YXZ" );

	this.deviceOrientation = {alpha: 43.06647261669845, beta: -1.8509070242249999, gamma: -87.30062171830068};

	this.screenOrientation = 0;

	// The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''

	var setObjectQuaternion = function () {

		var zee = new THREE.Vector3( 0, 0, 1 );

		var euler = new THREE.Euler();

		var q0 = new THREE.Quaternion();

		var q1 = new THREE.Quaternion( - Math.sqrt( 0.5 ), 0, 0, Math.sqrt( 0.5 ) ); // - PI/2 around the x-axis

		return function ( quaternion, alpha, beta, gamma, orient ) {

			euler.set( beta, alpha, - gamma, 'YXZ' );                       // 'ZXY' for the device, but 'YXZ' for us

			quaternion.setFromEuler( euler );                               // orient the device

			quaternion.multiply( q1 );                                      // camera looks out the back of the device, not the top

			quaternion.multiply( q0.setFromAxisAngle( zee, - orient ) );    // adjust for screen orientation

		}

	}();

	this.update = function () {


		var alpha  = scope.deviceOrientation.alpha ? THREE.Math.degToRad( scope.deviceOrientation.alpha ) : 0; // Z
		var beta   = scope.deviceOrientation.beta  ? THREE.Math.degToRad( scope.deviceOrientation.beta  ) : 0; // X'
		var gamma  = scope.deviceOrientation.gamma ? THREE.Math.degToRad( scope.deviceOrientation.gamma ) : 0; // Y''
		var orient = scope.screenOrientation       ? THREE.Math.degToRad( scope.screenOrientation       ) : 0; // O

		setObjectQuaternion( scope.object.quaternion, alpha, beta, gamma, orient );

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
		var q = [scope.object.quaternion.w, 
				scope.object.quaternion.x ,
				scope.object.quaternion.y, 
				scope.object.quaternion.z ];

		gx = 2 * (q[1]*q[3] - q[0]*q[2]);
		console.log(q[1]*q[3]);
		gy = 2 * (q[0]*q[1] + q[2]*q[3]);
		gz = q[0]*q[0] - q[1]*q[1] - q[2]*q[2] + q[3]*q[3];
		ypr[0] = Math.atan2(2 * q[1] * q[2] - 2 * q[0] * q[3], 2 * q[0]*q[0] + 2 * q[1] * q[1] - 1);
		ypr[1] = Math.atan(gx / Math.sqrt(gy*gy + gz*gz));
		ypr[2] = Math.atan(gy / Math.sqrt(gx*gx + gz*gz));

		ypr[0] *= radtoDeg;
		ypr[1] *= radtoDeg;
		ypr[2] *= radtoDeg;

		return ypr;
	};

};
// export the class
module.exports = OrientationProcessor;