
class WiiManager{

public:
	WiiManager(){
		chuck = WiiChuck();
		joyAxisX = JoyAxis(DEFAULT_ZERO_JOY_X);
		joyAxisY = JoyAxis(DEFAULT_ZERO_JOY_Y);
	}
	void setup(){
		chuck.begin();
		chuck.update();
	}
	/**The function read the wii chuck joystick and 2 button data and compress it to one byte
	in the following format
	joyX(3 bits), joyY(3 bits), buttonC(1 bit), buttonZ(1 bit)*/
	uint8_t getTheByte(){
		chuck.update(); 
		uint8_t joyX =  joyAxisX.getThreeBits(chuck.joyX);
		uint8_t joyY =  joyAxisY.getThreeBits(chuck.joyY);

		//joyY(3 bits), joyX(3 bits), buttonC(1 bit), buttonZ(1 bit)
		return (joyX<<5) | (joyY<<2) | (chuck.buttonC<<1) | chuck.buttonZ;

	}
private:
	WiiChuck chuck;
	JoyAxis joyAxisX;
	JoyAxis joyAxisY;
};