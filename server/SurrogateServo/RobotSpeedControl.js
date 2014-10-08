/**
The input for this module are 
	body pitch angel degree(effective -90~90)
	yaw error in degree(effective -180~180)
The product of the module are two serial port data integers
	Each serial port data range between 0~254, use clamp when preparing the data
Arduino will map the serial data(0~254) into 
	-MAX_THROTTLE~MAX_THROTTLE (MAX_THROTTLE=530 is a constant defined in the firmware) for the throttle
	-MAX_STEERING~MAX_STEERING (MAX_STEERING=136 is a constant defined in the firmware) for the steering
*/
function RobotSpeedControl() {
	//this is the mapped throttle to send through the serial port, range 0~254
	var mappedThrottle;
	//this is the mapped throttle to send through the serial port, range 0~254
	var mappedSteering;
	//serial data range 0~254, 255(0xFF) is used as the "start" sign for the package to send to Arduino
	//Don't confuse with the data package coming from Arduino. For example the Robot Quaternion package,
	//it use 0xFF as the "stop" sign
	//TODO: Maybe we will change the Arduino firmware to use 0xFF as the "start" sign when sending the
	//quaternion package, and change the node serial port buffer parser to receive the package.
	//This change can make the serial data protocol consistent project wise.
	var serialRangeConstant = 254;
	/**
	helper function to clamp a number between two values
	 */
	var clamp = function (num, min, max) {
		return num < min ? min : (num > max ? max : num);
	};
	/**
	helper function re-maps a number from one range to another with clamp on output. 
	*/
	var mapValue = function (in_value, in_min, in_max, out_min, out_max) {
		var temp_unclampped = (in_value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
		return clamp(temp_unclampped, out_min, out_max);
	};
	/**
	function to calculate the mappedThrottle when new user pitch angle is available is available
	return the mappedThrottle
	 */
	var updateMappedThrottle = function (body_pitch_degree) {
		//map the value to 0~254 for the serial data
		//round the number into a integer
		mappedThrottle = Math.round(mapValue(body_pitch_degree, -90, 90, 0, serialRangeConstant));
		return mappedThrottle;
	};
	
	/**
	function to calculate the mappedSteering when new user pitch angle is available is available
	return the mappedSteering
	 */
	var updateMappedSteering = function (error_yaw) {
		//map the value to 0~254 for the serial data
		//round the number into a integer
		//TODO: right now this is equivalent to using a P control with a small Kp gain
		//Try to multiple a error_yaw with a value > 1 to increase the Kp
		//Experiment PI/PID control is this is not enough
		console.log("error_yaw degree:", error_yaw);
		mappedSteering = Math.round(mapValue(error_yaw*2, -180, 180, 0, serialRangeConstant));
		return mappedSteering;
	};
	/**function to set the user body pitch angle in degree and the Yaw angle difference in degree
	return the mapped serial data array with length of 2
	*/
	this.getMappedArrayFromInput = function (body_pitch_degree, error_yaw) {
		var returnValue = [];
		returnValue[0] = updateMappedThrottle(body_pitch_degree);
		returnValue[1] = updateMappedSteering(error_yaw);
		return returnValue;
	};
};
// export the class
module.exports = RobotSpeedControl;
