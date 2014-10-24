#ifndef _PWMSERVO_H_
#define _PWMSERVO_H_

#include "Arduino.h"

class PwmServo
{
public:
	PwmServo();
	/**call in setup to initialize Timer 4 PWM function*/
	void init();
	/**take an int array with length of 3 
	each int range from 0~180*/
	void update(unsigned char servo_angles[]);
private:
	/**servo angle map on 0~180, 
	this range is wider than most of the servos
	adjustment might apply
		ie, my micro servos actual map is 32~165
	*/
	unsigned char servoAngle[3];
	/**
	duty = 0~2047
	*/
	int mappedDutytimes[3];
	/**set duty cycle for PWM 4A
	duty = 0~2047
	*/
	void setPwmDuty_A(unsigned int duty);
	/**set duty cycle for PWM 4B
	duty = 0~2047
	*/
	void setPwmDuty_B(unsigned int duty);
	/**set duty cycle for PWM 4D
	duty = 0~2047
	*/
	void setPwmDuty_D(unsigned int duty);
	/**map serial data to duty cycle count*/
	int mapDutytime(int serialdata);

};

#endif /* __PWMSERVO_H_ */