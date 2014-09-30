void setupCamServos()
{
  servos[0].attach(3);//yaw
  servos[1].attach(4);//pitch
  servos[2].attach(5);//roll
  resetServoAngle();
}
/**
Read the serial port and update the servo angle
For example serial data:
	0xFF 0x55 0x55 0x55
	will turn all three servos to 0x55 angle in degree
*/
void readAndUpdateServos()
{
  // if we get a valid byte, read analog ins:
  while(SERIAL_PORT.available() > 0) {
    // get incoming byte:
    serialByte = SERIAL_PORT.read();
	stateMachine(serialByte);

		if(newServoData){
			setServoAngle();
			#if defined(DEBUG_SERVO)
				echoTest();
			#endif
			newServoData = false;
		}
  }
	
}
void resetServoAngle(){
	for(int i=0;i<3;i++){
		servos[i].write(90);
	}
}
void setServoAngle(){
	for(int i=0;i<3;i++){
		servos[i].write(servoAngle[i]);
	}
}

//Function to echo back 3 servo Angle as bytes
void echoTest(){
	for(int i; i<3; i++){
		SERIAL_PORT.write(servoAngle[i]);
	}
}

//state machine to parse serial data
//to 3 servo angles
void stateMachine(unsigned char newbyte){
	switch (state)
	{
	case INITIAL_STATE:
		SERIAL_PORT.write("I");
		if(newbyte == START_BYTE){
			state = READ_SERVO0;
		}else{
			state = INITIAL_STATE;
		}
		break;
	case READ_SERVO0:
		SERIAL_PORT.write("0");
		if(newbyte == START_BYTE){
			state = INITIAL_STATE;
		}else {
			servoAngle[0] = newbyte;
			state = READ_SERVO1;
		}
		break;
	case READ_SERVO1:
		SERIAL_PORT.write("1");
		if(newbyte == START_BYTE){
			state = INITIAL_STATE;
		}else {
			servoAngle[1] = newbyte;
			state = READ_SERVO2;
		}
		break;
	case READ_SERVO2:
		SERIAL_PORT.write("2");
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
