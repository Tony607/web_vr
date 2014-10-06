/**
CameraServo module to handle one servo instances
pass parameter to constructor to set the map or use the setMap() function
use setAngle() function to get the mapped(rounded) value

Usage Example:

//import the module from current directory
var CameraServo = require("./CameraServo.js");

//create a servo instance and set the map, those two mapping value got from experiment of the actual servo
//sending 0x20-->0 degree, 0xA5-->180 degree. Different servos might vary
var yawServo = new CameraServo(0x20,0xa5);

//get the mapped value for 90 degree, in this case it is 99
var mappedValue = yawServo.setAngle(90);

*/
function CameraServo(min_map, max_map) {

	//the mapped min value(0 degree)
	var mapToDegree_0;
	//the mapped max value(180 degree)
	var mapToDegree_180;
	//the actual turning angle of the servo
	var servoAngle;
	//the mapped angle data to send through the serial port
	var servoAngleMapped;
	

	/**
	helper function to clamp a number between two values
	*/
	var clamp = function (num, min, max) {
		return num < min ? min : (num > max ? max : num);
	};
	/**
	helper function re-maps a number from one range to another. 
	*/
	var mapValue = function (in_value, in_min, in_max, out_min, out_max) {
		return (in_value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
	};
	/**
	function to calculate the servoAngleMapped angle when new servoAngle is available
	 */
	var updateMappedAngle = function () {
		//round the number into a integer
		servoAngleMapped = Math.round(mapValue(servoAngle, 0, 180, mapToDegree_0, mapToDegree_180));
	};
	/**
	function to set the servo actual turning angle from 0~180 degree
	the return value is the mapped servo angle for serial port
	*/
	this.setAngle = function (angle) {
		servoAngle = angle;
		updateMappedAngle();
		return servoAngleMapped;
	};
	/**
	function to set the serial angle map for this servo
	i.e. setMap(0x20,0xA5); 0x20 is mapped to 0 degree, 0xA5 is mapped to 180 degree

	 */
	this.setMap = function (min, max) {
		if (min !== undefined && max !== undefined) {
			mapToDegree_0 = clamp(min, 0, 180);
			mapToDegree_180 = clamp(max, 0, 180);
		}
	};

	//set the map from the constructor value
	this.setMap(min_map, max_map);
};
// export the class
module.exports = CameraServo;
