#include "Arduino.h"
#include "PwmServo.h"

/** Default constructor.
*/
PwmServo::PwmServo(){
}

void PwmServo::init(){

	pinMode(13, OUTPUT);
	pinMode(5, OUTPUT); // set pin 5 to output
	pinMode(6, OUTPUT); 
	pinMode(10, OUTPUT); 

	TCCR4E |= (1<<ENHC4); // this enables the enhanced mode of the atmega32u4's timer 4. it gives one more bit of resolution (without is has just 10-bit)
	TCCR4B &= ~(1<<CS40); 
	TCCR4B &= ~(1<<CS41); 
	TCCR4B &= ~(1<<CS42); 
	TCCR4B |= (1<<CS43); // sets the prescaler to 128 .. this is needed because it it a high frequency timer
	TCCR4D |= (1<<WGM40); //set it to phase and frequency correct mode

	// now there is one special thing with timer 4... it counts with 11-bit resolution but the compare registers are just 8-bit
	// so we cant set a 11 bit value to them with just register = 2000..
	// it has a special 3 bit register for the high byte. means we need to split the 11-bit value to one 3-bit and one 8-bit
	// to set its top value to 2048 (hex 3FF) we set its high byte bit to hex 3
	//TC4H = 0x3;
	TC4H = 0x03;
	// and the the 8 bit register to hex FF
	OCR4C = 0xFF;
	// the Timer combines this values to hex 3FF (2048)

	// we need to do the same thing to write 11-bit values to the comperators
	// but we can do the split automaticly ;)
	TCCR4A |= _BV(PWM4A);//enable pwm 4A
	TCCR4A |= _BV(PWM4B);//enable pwm 4B
	//cleared on cmp match, OC4A/D13[led]/PC7 , D5(PC6/_OC4A) for servo 0
	TCCR4A |= _BV(COM4A0);
	TCCR4A &= ~(1<<COM4A1);
	//D10(PB6/OC4B) set on cmp match,servo 1
	TCCR4A |= _BV(COM4B0);
	TCCR4A |= _BV(COM4B1);

	TCCR4C |= _BV(PWM4D);//enable pwm 4D
	//D6(PD7/OC4D) set on cmp match,servo 1
	TCCR4C |= _BV(COM4D0);
	TCCR4C |= _BV(COM4D1);
	//1854 is the measured middle point for my 9g micro servo,
	//duty cycle=9.4%, + pulse width = 1.54ms
	setPwmDuty_A(1854);	
	setPwmDuty_B(1854);
	setPwmDuty_D(1854);
}

void PwmServo::update(unsigned char servo_angles[]){
	for(int i=0;i<3;i++){
		mappedDutytimes[i] = mapDutytime(servo_angles[i]);
	}
	setPwmDuty_B(mappedDutytimes[1]);
	setPwmDuty_A(mappedDutytimes[0]);
	setPwmDuty_D(mappedDutytimes[2]);
	TC4H = 0x00;
}


/**set duty cycle for PWM 4A
duty = 0~2047
*/
void PwmServo::setPwmDuty_A(unsigned int duty) {
	TC4H = (duty) >> 8; 
	OCR4A = (duty) & 255; 
}
/**set duty cycle for PWM 4B
duty = 0~2047
*/
void PwmServo::setPwmDuty_B(unsigned int duty) {
	TC4H = (duty) >> 8; 
	OCR4B = (duty) & 255; 
}
/**set duty cycle for PWM 4D
duty = 0~2047
*/
void PwmServo::setPwmDuty_D(unsigned int duty) {
	TC4H = (duty) >> 8; 
	OCR4D = (duty) & 255; 
}
/**map serial data to duty cycle count*/
int PwmServo::mapDutytime(int serialdata){
	int input = 180-serialdata;
	int dutytime = map(input, 0,180,1700,2040);
	return dutytime;
}