

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
	//Euler angle object of User body world, set by q_BodyWorld quaternion
	var euler_BodyWorld = new THREE.Euler( 0, 0, 0, 'XYZ' );
	//Euler angle object of Robot, set by q_RobotWorld
	var euler_RobotWorld = new THREE.Euler( 0, 0, 0, 'XYZ' );
	
	var radtoDeg = 180 / Math.PI;
	
	var debug_mode = false;
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
		ypr[1] = Math.atan(gy / Math.sqrt(gx * gx + gz * gz));
		ypr[0] = Math.atan2(2 * q[1] * q[2] - 2 * q[0] * q[3], 2 * q[0] * q[0] + 2 * q[1] * q[1] - 1);
		ypr[2] = Math.atan(gx / Math.sqrt(gy * gy + gz * gz));

		ypr[0] *= radtoDeg;
		ypr[1] *= radtoDeg;
		ypr[2] *= radtoDeg;

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

		return yaw;
	};
	/**
	function to get the Roll angle from quaternion
	 */
	var getRollFromQuaternion = function (quaternion) {
		var roll;
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
		roll = Math.atan(gy / Math.sqrt(gx * gx + gz * gz));

		roll *= radtoDeg;
		return roll;
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
		//TODO: try switching the order of multiply
		q_camL.multiplyQuaternions(q_robotW_Inv,q_camW );
		return q_camL;
	};
	/**
	function called approximately every 20ms to calculate the robot speed, throttle and steering
	Return the calculated throttle and steering array
	 */
	var calucateRobotSpeed = function () {
		euler_BodyWorld.setFromQuaternion(q_BodyWorld);
		var body_pitch = -euler_BodyWorld.y*radtoDeg;
		var body_yaw = euler_BodyWorld.x*radtoDeg;
		//calculate the pitch angle of the user body from quaternion
		//var body_pitch = getPitchFromQuaternion(q_BodyWorld);
		//print the pitch angle
		console.log("user body_pitch:", body_pitch.toFixed(2));
		//calculate the yaw angle of the user body from quaternion
		//var body_yaw = getYawFromQuaternion(q_BodyWorld);
		console.log("body_yaw:", body_yaw.toFixed(2));
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

	/**get the servo array for the serial port, length = 3*/
	var getServoArray = function () {
		q_CameraLocal = calculateCameraLocalQuaternion(q_CameraWorld, q_RobotWorld);
		var ypr_angles = getYawPitchRollFromQuaternion(q_CameraLocal);

		//print the angles
		//console.log("camera Local ypr:", ypr_angles[0].toFixed(2), ypr_angles[1].toFixed(2), ypr_angles[2].toFixed(2));
		return [yawServo.setAngle(ypr_angles[0]), pitchServo.setAngle(ypr_angles[1]), rollServo.setAngle(ypr_angles[2])];
	};
	/**get the pushup servo command for the serial port*/
	var getPushupServo = function () {
		var pushupServoCmd = 0x58;
		//var pushupServoCmd = (require('os').uptime()*10).toFixed(0)%100+0x21;
		return pushupServoCmd;
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
		//
		//q_CameraWorld.set(q.x, q.y, q.z, q.w);
		//q_CameraWorld.set(q.y, -q.x, q.z, q.w);
		q_CameraWorld.set(q.y, q.z,q.x, q.w);//apply when phone is flipped 90 degree (VR mode)
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
	/**Function to set the debug mode on or off*/
	this.setDebugMode = function (flag){
		if(flag!==undefined){
			debug_mode = flag;
		}
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
		//calculate the yaw error and body pitch angles in degree
		//This is called for every new robot world quaternion change, approximately 50Hz(every 20ms)
		var throttle_steering_array = calucateRobotSpeed();
		var servo_array = getServoArray();
		var serial_array = servo_array.concat(throttle_steering_array);
		serial_array[5] = getPushupServo();
		serial_array[6] = 0xFF;
		var serial_buf = new Buffer(serial_array);
		//console.log("serial_buf:", serial_buf);
		return serial_buf;
	};	
	/**
	Calculate the robot pitch for its quaternion,
	return the pitch angle in degree
	*/
	this.calculateRobotPitchAngle = function(){
		//euler_RobotWorld.setFromQuaternion(q_RobotWorld);
		//var robot_pitch = euler_RobotWorld.x*radtoDeg;
		var robot_pitch = getRollFromQuaternion(q_RobotWorld);
		return robot_pitch;
	};
	/**
	function to instantiate and set the serial angle map for Yaw, pitch, roll servos
	parameter "servos" is a 3 x 2 array
	i.e. servos[0]=[0x20,0xA5] meaning 0x20 is mapped to 0 degree, 0xA5 is mapped to 180 degree
	for the Yaw servo

	 */
	var initProcessor = function (servos) {
		//check the data is valid 3x2 array
		if (servos === undefined || servos.length !== 3 ||
			servos[0].length !== 4 ||
			servos[1].length !== 4 ||
			servos[2].length !== 4) {
			console.log("===Servo map data array is invalid!===");
			console.log("It should be a 3 x 4 integer array.");
			return;
		}
		// Instantiate there servos
		//we just use the filter on the yaw servo, because it seems like to have the largest vibration
		yawServo = new CameraServo(servos[0][0], servos[0][1], servos[0][2], servos[0][3], 0);
		pitchServo = new CameraServo(servos[1][0], servos[1][1], servos[1][2], servos[1][3], 0);
		rollServo = new CameraServo(servos[2][0], servos[2][1], servos[2][2], servos[2][3], 0);

		robotSpeedController = new RobotSpeedControl();
	};

	//set the map from the constructor value
	initProcessor(servosMap);
};
// export the class
module.exports = OrientationProcessor;
