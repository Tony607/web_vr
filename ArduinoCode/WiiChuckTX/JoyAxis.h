/**This class contains information about one Axis of Wii Chuck's joystick, in the parent
class, we can initiate two axis, X and Y*/
class JoyAxis{

public:
	JoyAxis(){
		findTheJoyMapping(128);
	}
	JoyAxis(uint8_t defaultZeroJoy){

		findTheJoyMapping(defaultZeroJoy);
	}
	/**The function take the raw axis value(the 8 bits value) and convert it to 0~6 with uint8_t type
	the hysteresis filter emulate a hysteresis effect to reduce the gittering between two integer values
	*/
	uint8_t getThreeBits(uint8_t readinValue){
		readinValue = constrain(readinValue, joyAxis_min_map, joyAxis_max_map);
		float flexPinValue_current =  mapfloat(readinValue, joyAxis_min_map, joyAxis_max_map, 0, 6);
		if(abs((float)joyAxis_result_his-flexPinValue_current)>0.5){
			//round
			joyAxis_result_his = (int)(flexPinValue_current+0.5);
		}
		return joyAxis_result_his;

	}
private:
	/*The mapping of joy sticks*/
	uint8_t joyAxis_min_map;
	uint8_t joyAxis_max_map;
	/***/
	uint8_t joyAxis_result_his;

	float mapfloat(int x, int in_min, int in_max, int out_min, int out_max)
	{
		return (float)(x - in_min) * (out_max - out_min) / (float)(in_max - in_min) + out_min;
	}
	/**Clip one side to map the raw value around the center of the default zero joystick value, 
	so that both side with same width*/
	void findTheJoyMapping(uint8_t default_zero_joy){
		if(JOY_AXIS_MAX/2 >= default_zero_joy){
			//cut the end
			joyAxis_min_map = 0;
			joyAxis_max_map = default_zero_joy*2;
		}else {
			//cut the beginning
			joyAxis_min_map = 2*default_zero_joy- JOY_AXIS_MAX;
			joyAxis_max_map = JOY_AXIS_MAX;

		}
	}


};