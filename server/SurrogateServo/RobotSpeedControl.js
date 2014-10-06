
function RobotSpeedControl(max_throttle, max_steering) {
	//this is the max configured throttle, the min configured throttle is -max_THROTTLE
	var max_THROTTLE;
	//this is the max configured steering, the min configured steering is -max_STEERING
	var max_STEERING;
	/**
	helper function to clamp a number between two values
	*/
	var clamp = function (num, min, max) {
		return num < min ? min : (num > max ? max : num);
	};
	this.config_Max_throttle_steering = function (max_throttle, max_steering) {
		if (max_throttle !== undefined && max_steering !== undefined) {
			max_THROTTLE = max_throttle;
			max_STEERING = max_steering;
		}
	};

	//set the map from the constructor value
	this.config_Max_throttle_steering(max_throttle, max_steering);
};
// export the class
module.exports = RobotSpeedControl;
