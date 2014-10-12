/**
CameraServo module to handle one servo instance
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
function CameraServo(mid_map, max_map, min_limited_map) {

	//the mapped min value(90 degree)
	var mapToDegree_90;
	//the mapped max value(180 degree)
	var mapToDegree_180;
	//the mapped min value limited by physical layout
	var mapToDegree_min_limited;
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
	helper function re-maps a number from one range to another without clamp on output. 
	*/
	var mapUnlimited = function (in_value, in_min, in_max, out_min, out_max) {
		var temp_unclampped = (in_value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
		return temp_unclampped;
	};
	/**
	helper function re-maps a number from one range to another with clamp on output. 
	*/
	var mapBetween = function (in_value, in_min, in_max, out_min, out_max) {
		var temp_unclampped = (in_value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
		return clamp(temp_unclampped, out_min, out_max);
	};
	/**
	function to calculate the servoAngleMapped angle when new servoAngle is available
	 */
	var updateMappedAngle = function () {
		//round the number into a integer
		servoAngleMapped = Math.round(mapUnlimited(servoAngle, 0, -90, mapToDegree_90, mapToDegree_180));
		//clamp the mapped angle by physical layout
		servoAngleMapped = clamp(servoAngleMapped, mapToDegree_min_limited, mapToDegree_180);
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
	this.setMap = function (mid, max, min_limited) {
		if (min !== undefined && max !== undefined) {
			mapToDegree_90 = clamp(mid, 0, 180);
			mapToDegree_180 = clamp(max, 0, 180);
			mapToDegree_min_limited = clamp(min_limited, 0, 180);
		}
	};

	//set the map from the constructor value
	this.setMap(mid_map, max_map, min_limited_map);
};
// export the class
module.exports = CameraServo;
