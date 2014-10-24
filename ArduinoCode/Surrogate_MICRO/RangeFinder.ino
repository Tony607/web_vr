/**
RangeFinder.ino 
This file contains the initialization and interfacing with the ultrasound range sensor
This is the kind of ultrasound range sensor that has a tirgger pin and an echo pin
*/


/**
Call this function in the Arduino setup function to setup the peripherals needed for this module

*/
void initializeRangeSensor(){

	//setup ports
	pinMode(ECHO_PIN,INPUT);   //PD4, ICP1
	pinMode(TRIGGER_PIN,OUTPUT);//trigger pin
	// initialize timer1 for the capture interrput
	noInterrupts();           // disable all interrupts
	TCCR1A = 0;
	TCCR1B = 0;
	TCNT1  = 0;

	OCR1A = 65533;            // compare match register 16MHz/256/2Hz
	TCCR1B |= (1 << WGM12);   // CTC mode
	TCCR1B |= (1 << CS12);    // 256 prescaler 
	//TIMSK1 |= (1 << OCIE1A);  // enable timer compare interrupt
	TIMSK1 |= ((1 << ICIE1)| (1 << TOIE1));   //Set capture interrupt
	interrupts();             // enable all interrupts
	TCCR1B |= (1 << ICNC1);               // Input Capture Noise Canceler
	TCCR1B |= (1 << ICES1);               //Set capture rising edge
}
/**
Call this function in the loop about every 20ms or so to toggle the the trig pin
*/
void toggleTrigPin(){
	//It's faster to set the bit directly than calling digitalWrite(TRIGGER_PIN, trigEdge);
	if(trigEdge){
		CLR(PORTB,2);
	}else{
		SET(PORTB,2);
	}
	trigEdge = !trigEdge;
}
/**Timer 1 compare ISR*/
ISR(TIMER1_COMPA_vect)          // timer compare interrupt service routine
{
	//digitalWrite(ledPin, digitalRead(ledPin) ^ 1);   // toggle LED pin
}
/**Timer 1 capture ISR*/
ISR(TIMER1_CAPT_vect){
	if(TCCR1B & (1 << ICES1)){
		TCNT1  = 0;
	}else{
		pulseWidth = ICR1;               //copy capture value
	}
	TCCR1B ^= 1 << ICES1;
}
/**
call this function after getting a new user throttle data to dampping the throttle accordingly
If obstacle is close,
return the dampping_radio
*/
float obstacleAvoidance(){
	//this is the damping_radio that will be multiplied to the positive MAX_THROTTLE
	float dampping_radio = 1.0;
	//Do the math to calculate the actual horizontal distance pulseWidth
	unsigned int horizontalPulseWidth = pulseWidth*cos((angle_adjusted-30.0)*GRAD2RAD);
	//TODO:remove those serial print when done with debugging
	//verify tilting forward is positive, o/w reverse the angel in the calculation above
	//SERIAL_PORT.println(angle_adjusted);
	//SERIAL_PORT.println(horizontalPulseWidth);
	if(horizontalPulseWidth<WARNING_PW){//enterning the warning zone

		dampping_radio = map_dampping_radio_DeadBand(horizontalPulseWidth,WARNING_PW, DEADBAND_FAR, DEADBAND_NEAR,DANGER_PW);
		//SERIAL_PORT.println(dampping_radio);
	}
	return dampping_radio;
}
/**
Helpper function to map a dampping_radio with clamp at the edge
return the dampping_radio
*/
//float map_dampping_radio(unsigned int in_value,unsigned int in_min,unsigned int in_max){
//	if(in_value<in_min){
//		in_value = in_min;
//	}else if(in_value>in_max){
//		in_value = in_max;
//	}
//	float temp = (float)(in_value - in_min)/ (float)(in_max - in_min);
//	return temp;
//}


/**
Helpper function to map a dampping_radio with clamp at the edge
return the dampping_radio
*/
float map_dampping_radio_DeadBand(int in_value,int warning_pw,int deadband_far,int deadband_near,int danger_pw){
	float temp = 1.0;
	if(in_value>=warning_pw){

	}else if(in_value<warning_pw && in_value>=deadband_far){//the slop before the deadband
		temp = (float)(in_value - deadband_far)/ (float)(warning_pw - deadband_far);
	}else if(in_value>=deadband_near){
		temp = 0.0;
	}else if(in_value>=danger_pw){
		temp = (float)(in_value - deadband_near)/ (float)(deadband_near - danger_pw)*0.1;
	}else{//<danger_pw
		temp = -0.3;
	}
	return temp;
}