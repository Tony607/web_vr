/**
RangeFinder.ino 
This file contains the initialization and interfacing with the ultrasound range sensor
This is the kind of ultrasound range sensor that has a tirgger pin and an echo pin
*/


/**
Call this function in the Arduino setup function to setup the peripherals needed for this module

*/
#ifdef USE_SONAR

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
		//enable Timer 1 capture
		SET(TIMSK1,ICIE1);
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
	//if is rising edge, clear the timer counter
	if(TCCR1B & (1 << ICES1)){
		TCNT1  = 0;
	}else{//if is trailing edge, read the capture value which is the pulse width
		//disable Timer 1 capture
		CLR(TIMSK1,ICIE1);
		pulseWidth = ICR1;               //copy capture value
		//Do the math to calculate the actual horizontal distance in cm
		horizontalDistance = (float)pulseWidth*cos((angle_adjusted)*GRAD2RAD)/3.65;
		if(horizontalDistance>254){
			horizontalDistance = 254;
		} else if(horizontalDistance<0){
			horizontalDistance = 0;
		}
	}
	//toggle capture edge
	TCCR1B ^= 1 << ICES1;
}
#endif

#ifdef USE_IR
/**function to set up the IR range sensor*/
void initializeIRSensor(){
	pinMode(IR_PIN, INPUT);
}
/**functions return distance in cm using GP2Y0A21Y IR sensor*/
uint8_t readDistanceIR(){
	unsigned int distanceCM = (6787.0/(analogRead(IR_PIN)-3.0))-4.0;//5673/analogRead(IR_PIN);
	if(distanceCM>254){
		distanceCM = 254;
	}
	return (uint8_t)distanceCM;
}
#endif