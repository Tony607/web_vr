var CameraServo = require("./CameraServo.js");
var RobotSpeedControl = require("./RobotSpeedControl.js");
var THREE = require("three");
function OrientationProcessor(servosMap) {
	//Three servos
	var yawServo;
	var pitchServo;
	var rollServo;
	//RobotSpeedControl instance for calculating throttle and steering data
	var robotSpeedController;
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
	function to get the actual turning angles array(length of 3) for those three servos from the
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
	function to get the Pitch angle from quaternion
	 */
	var getPitchFromQuaternion = function (quaternion) {
		var pitch;
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
		pitch = Math.atan(gx / Math.sqrt(gy * gy + gz * gz));

		pitch *= radtoDeg;

		//print the pitch angle
		console.log("Pitch:", pitch.toFixed(2));
		return pitch;
	};
	/**
	function to get the Yaw angle from quaternion
	 */
	var getYawFromQuaternion = function (quaternion) {
		var yaw;
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
		yaw = Math.atan2(2 * q[1] * q[2] - 2 * q[0] * q[3], 2 * q[0] * q[0] + 2 * q[1] * q[1] - 1);

		yaw *= radtoDeg;

		//print the yaw angle
		console.log("yaw:", yaw.toFixed(2));
		return yaw;
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
	/**
	function called approximately every 20ms to calculate the robot speed, throttle and steering
	Return the calculated throttle and steering array
	 */
	var calucateRobotSpeed = function () {
		//calculate the pitch angle of the user body from quaternion
		var body_pitch = getPitchFromQuaternion(q_BodyWorld);
		//calculate the yaw angle of the user body from quaternion
		var body_yaw = getYawFromQuaternion(q_BodyWorld);
		//calculate the yaw angle of the robot from quaternion
		var robot_yaw = getYawFromQuaternion(q_RobotWorld);
		//calculate the yaw angle error from the two previous yaw angles
		var error_yaw = robot_yaw - body_yaw;
		//if the angles are opposite 			
		if (error_yaw > 180) {//e.g. robot_yaw = 170, body_yaw = -175
			error_yaw = error_yaw - 360;
		} else if (error_yaw < -180) {//e.g. robot_yaw = -170, body_yaw = 175
			error_yaw = 360 + error_yaw;
		}
		//get the two element array that contains data for the serial port
		var throttle_steering_array = robotSpeedController.getMappedArrayFromInput(body_pitch, error_yaw);
		//console.log("throttle_steering_array", throttle_steering_array);
		return throttle_steering_array;
	};
	/**
	function to set the q_CameraWorld, it take an object with w,x,y,z properties
	this is the aligned and adjusted Quaternion of the head mount display,
	in this case the Google Cardboard.
	 */
	this.setCameraWorldQuaternion = function (q) {
		if (q === undefined || isNaN(q.x) || isNaN(q.y) || isNaN(q.z) || isNaN(q.w)) {
			console.log("setCameraWorldQuaternion property check failed!");
			return;
		}
		q_CameraWorld.set(q.x, q.y, q.z, q.w);
	};

	/**
	function to set the q_BodyWorld, it take an object with w,x,y,z properties
	Aligned and adjusted Quaternion of the wearable body tracker,
	it is placed on upper human body
	 */
	this.setBodyWorldQuaternion = function (q) {
		if (q === undefined || isNaN(q.x) || isNaN(q.y) || isNaN(q.z) || isNaN(q.w)) {
			console.log("setBodyWorldQuaternion property check failed!");
			return;
		}
		q_BodyWorld.set(q.x, q.y, q.z, q.w);
	};
	/**
	function to set the q_RobotWorld, it take an object with w,x,y,z properties
	Robot IMU Measured Quaternion
	Return serial_array for the serial port
	 */
	this.setRobotWorldQuaternion = function (q) {
		if (q === undefined || isNaN(q.x) || isNaN(q.y) || isNaN(q.z) || isNaN(q.w)) {
			console.log("setRobotWorldQuaternion property check failed!");
			return;
		}
		q_RobotWorld.set(q.x, q.y, q.z, q.w);
		//TODO: add the function call to do the RobotSpeedControl,
		//calculate the yaw error and body pitch angles in degree
		//This is called for every new robot world quaternion change, approximately 50Hz(every 20ms)
		//need to profile the performance on the target processor, and decide whether we
		//need to fire a separate process for this
		var throttle_steering_array = calucateRobotSpeed();
		var servo_array = this.getServoArray();
		var serial_array = servo_array.concat(throttle_steering_array);
		serial_array[5] = 0xFF;
		var serial_buf = new Buffer(serial_array);
		console.log("serial_buf:", serial_buf);
		return serial_buf;
	};

	/**get the servo array for the serial port, length = 3*/
	this.getServoArray = function () {
		q_CameraLocal = calculateCameraLocalQuaternion(q_CameraWorld, q_RobotWorld);
		var ypr_angles = getYawPitchRollFromQuaternion(q_CameraLocal);

		return [yawServo.setAngle(ypr_angles[0]), yawServo.setAngle(ypr_angles[1]), yawServo.setAngle(ypr_angles[2])];
	};
	/**
	Function generates the buffer for Arduino
	It combine the servo data and robot throttle, steering data and append the start sign at the beginning
	 */
	this.generateSerialPackageBuffer = function () {};
	/**
	function to instantiate and set the serial angle map for Yaw, pitch, roll servos
	parameter "servos" is a 3 x 2 array
	i.e. servos[0]=[0x20,0xA5] meaning 0x20 is mapped to 0 degree, 0xA5 is mapped to 180 degree
	for the Yaw servo

	 */
	var initProcessor = function (servos) {
		//check the data is valid 3x2 array
		if (servos === undefined || servos.length !== 3 ||
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

		robotSpeedController = new RobotSpeedControl();
	};
	//set the map from the constructor value
	initProcessor(servosMap);
};
// export the class
module.exports = OrientationProcessor;
