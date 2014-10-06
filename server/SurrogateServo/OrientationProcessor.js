var CameraServo = require("./CameraServo.js");
var THREE = require("three");
function OrientationProcessor(servosMap) {
	//Three servos
	var yawServo;
	var pitchServo;
	var rollServo;
	//Camera Local Quaternion
	var q_CameraLocal = new THREE.Quaternion();
	//Aligned and adjusted Quaternion of the head mount display, in this case the Google Cardboard
	var q_CameraWorld = new THREE.Quaternion();
	//Aligned and adjusted Quaternion of the wearable body tracker, it is placed on upper human body
	var q_BodyWorld = new THREE.Quaternion();
	//Robot IMU Measured Quaternion
	var q_RobotWorld = new THREE.Quaternion();

	var radtoDeg = 180 / Math.PI;

	/**
	function to get the actual turning angle array(length of 3) for those three servos from the
	Camera's local Quaternion		(q_CameraLocal)
	 */
	var getYawPitchRollFromQuaternion = function (quaternion) {
		var ypr = [0, 0, 0];
		var gx,
		gy,
		gz; // estimated gravity direction
		var q = [quaternion.w,
			quaternion.x,
			quaternion.y,
			quaternion.z];

		gx = 2 * (q[1] * q[3] - q[0] * q[2]);
		gy = 2 * (q[0] * q[1] + q[2] * q[3]);
		gz = q[0] * q[0] - q[1] * q[1] - q[2] * q[2] + q[3] * q[3];
		ypr[0] = Math.atan(gx / Math.sqrt(gy * gy + gz * gz));
		ypr[1] = Math.atan(gy / Math.sqrt(gx * gx + gz * gz));
		ypr[2] = Math.atan2(2 * q[1] * q[2] - 2 * q[0] * q[3], 2 * q[0] * q[0] + 2 * q[1] * q[1] - 1);

		ypr[0] *= radtoDeg;
		ypr[1] *= radtoDeg;
		ypr[2] *= radtoDeg;
		var tmp = ypr[1];
		ypr[1] = ypr[0];
		ypr[0] = tmp;

		//print the angles
		console.log("angles:", ypr[0].toFixed(2), ypr[1].toFixed(2), ypr[2].toFixed(2));
		return ypr;
	};

	/**
	function to calculate the camera local quaternion from the camera world quaternion and robot world quaternion

	The Equation:
	q_CameraLocal = q_CameraWorld x q_RobotWorld.inverse

	 */
	var calculateCameraLocalQuaternion = function (q_camW, q_robotW) {
		var q_camL = new THREE.Quaternion();
		var q_robotW_Inv = new THREE.Quaternion();
		q_robotW_Inv.copy(q_robotW);
		q_robotW_Inv.inverse();
		q_camL.multiplyQuaternions(q_camW, q_robotW_Inv);
		return q_camL;
	};

	/**function to set the q_CameraWorld, it take an object with w,x,y,z properties*/
	this.setCameraWorldQuaternion = function (q) {
		if (q === undefined || isNaN(q.x) || isNaN(q.y) || isNaN(q.z) || isNaN(q.w)) {
			console.log("setCameraWorldQuaternion property check failed!");
			return;
		}
		q_CameraWorld.set(q.x, q.y, q.z, q.w);
	};

	/**function to set the q_BodyWorld, it take an object with w,x,y,z properties*/
	this.setBodyWorldQuaternion = function (q) {
		if (q === undefined || isNaN(q.x) || isNaN(q.y) || isNaN(q.z) || isNaN(q.w)) {
			console.log("setBodyWorldQuaternion property check failed!");
			return;
		}
		q_BodyWorld.set(q.x, q.y, q.z, q.w);
	};
	/**function to set the q_RobotWorld, it take an object with w,x,y,z properties*/
	this.setRobotWorldQuaternion = function (q) {
		if (q === undefined || isNaN(q.x) || isNaN(q.y) || isNaN(q.z) || isNaN(q.w)) {
			console.log("setRobotWorldQuaternion property check failed!");
			return;
		}
		q_RobotWorld.set(q.x, q.y, q.z, q.w);
	};

	/**get the servo array for the serial port, length = 3*/
	this.getServoArray = function () {
		q_CameraLocal = calculateCameraLocalQuaternion(q_CameraWorld, q_RobotWorld);
		var ypr_angles = getYawPitchRollFromQuaternion(q_CameraLocal);

		return [yawServo.setAngle(ypr_angles[0]), yawServo.setAngle(ypr_angles[1]), yawServo.setAngle(ypr_angles[2])];
	};

	/**
	function to instantiate and set the serial angle map for Yaw, pitch, roll servos
	parameter "servos" is a 3 x 2 array
	i.e. servos[0]=[0x20,0xA5] meaning 0x20 is mapped to 0 degree, 0xA5 is mapped to 180 degree
	for the Yaw servo

	 */
	this.initServos = function (servos) {
		//check the data is valid 3x2 array
		if (servos.length !== 3 ||
			servos[0].length !== 2 ||
			servos[1].length !== 2 ||
			servos[2].length !== 2) {
			console.log("===Servo map data array is invalid!===");
			console.log("It should be a 3 x 2 integer array.");
			return;
		}
		// Instantiate there servos
		yawServo = new CameraServo(servos[0][0], servos[0][1]);
		pitchServo = new CameraServo(servos[1][0], servos[1][1]);
		rollServo = new CameraServo(servos[2][0], servos[2][1]);
	};
	//set the map from the constructor value
	this.initServos(servosMap);
};
// export the class
module.exports = OrientationProcessor;
