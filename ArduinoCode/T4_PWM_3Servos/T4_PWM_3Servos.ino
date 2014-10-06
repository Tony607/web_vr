/*
	This is a simple demo to control 3 servos by 32u4's timer 4 hardware PWM.
	send 3 angles in the format described below through serial port to update
	the servo angles

	Processor:ATmega32u4(running at 16Mhz)

	Measured PWM frequency 61.09HZ
	
	//////System Resources//////

	Timer 4 
		11bits = 8bits+2bits+1bit
		counter=0~2047

	PWM pins
		D5(PC6/_OC4A)	-->	servo0
		D6(PD7/OC4D)	-->	servo2
		(D9(PB5/_OC4B)	-->	free for other GPIO usage)
		D10(PB6/OC4B)	-->	servo1
		
		note:OC4A/D13[led]/PC7 is the complementary output of D5(PC6/_OC4A),
			so it can't be used as GPIO

	Serial port: Serial1(32u4's hardware serial port)
		Baud rate: 115200
		command format: 0xFF 0x20 0x62 0xA5
			where 0xFF is the start sign 
			0x20 make servo 0 go 90 degree(CW)
			0x62 make servo 1 go 0 degree
			0xA5 make servo 2 go -90 degree
*/

#define INITIAL_STATE 0
#define READ_SERVO0 1
#define READ_SERVO1 2
#define READ_SERVO2 3

#define START_BYTE 0XFF
#define DEBUG
int inByte = 0;         // incoming serial byte
unsigned char state = 0;
bool newServoData = false;
unsigned char servoAngle[3];
int mappedDutytimes[3];

bool toggle  = true;
/**set duty cycle for PWM 4A
	duty = 0~2047
*/
void setPwmDuty_A(unsigned int duty) {
	TC4H = (duty) >> 8; 
	OCR4A = (duty) & 255; 
}
/**set duty cycle for PWM 4B
	duty = 0~2047
*/
void setPwmDuty_B(unsigned int duty) {
	TC4H = (duty) >> 8; 
	OCR4B = (duty) & 255; 
}
/**set duty cycle for PWM 4D
	duty = 0~2047
*/
void setPwmDuty_D(unsigned int duty) {
	TC4H = (duty) >> 8; 
	OCR4D = (duty) & 255; 
}
void setup(){
	pinMode(13, OUTPUT);
	pinMode(5, OUTPUT); // set pin 5 to output
	pinMode(6, OUTPUT); 
	pinMode(9, OUTPUT); 
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
	Serial1.begin(115200);

}

void loop(){

	// if we get a valid byte, read analog ins:
	if (Serial1.available() > 0) {
		// get incoming byte:
		inByte = Serial1.read();
		stateMachine(inByte);

		if(newServoData){
			setServoAngle();
			newServoData = false;
		}
	}
	//pin 9 is free for GPIO usage
	toggle = !toggle;
	digitalWrite(9, toggle);
}
/**
map serial data to duty cycle count and update the TC4H and output compare Regs
*/
void setServoAngle(){
	for(int i=0;i<3;i++){
		mappedDutytimes[i] = mapDutytime(servoAngle[i]);
	}
	setPwmDuty_B(mappedDutytimes[1]);
	setPwmDuty_A(mappedDutytimes[0]);
	setPwmDuty_D(mappedDutytimes[2]);
	TC4H = 0x00;
}
/**map serial data to duty cycle count*/
int mapDutytime(int serialdata){
	int input = 180-serialdata;
	int dutytime = map(input, 0,180,1700,2040);
#if defined(DEBUG)
	Serial1.write("D=");
	Serial1.print(dutytime, DEC);
	Serial1.write(";");
#endif
	return dutytime;
}
/**state machine to parse serial data to 3 servo angle data*/
void stateMachine(unsigned char newbyte){
	switch (state)
	{
	case INITIAL_STATE:
		if(newbyte == START_BYTE){
			state = READ_SERVO0;
		}else{
			state = INITIAL_STATE;
		}
		break;
	case READ_SERVO0:
		if(newbyte == START_BYTE){
			state = INITIAL_STATE;
		}else {
			servoAngle[0] = newbyte;
			state = READ_SERVO1;
		}
		break;
	case READ_SERVO1:
		if(newbyte == START_BYTE){
			state = INITIAL_STATE;
		}else {
			servoAngle[1] = newbyte;
			state = READ_SERVO2;
		}
		break;
	case READ_SERVO2:
		if(newbyte == START_BYTE){
			state = INITIAL_STATE;
		}else {
			servoAngle[2] = newbyte;
			newServoData = true;
			//State Machine cycle is complete
			state = INITIAL_STATE;
		}
		break;
	default:
		state = INITIAL_STATE;
		break;
	}
}
