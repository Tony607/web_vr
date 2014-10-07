/**
function should be put in the main loop
It parse the incoming serial data and set the servo angles
*/
void serialDataParser(){
	if (SERIAL_PORT.available() > 0) {
		// get incoming byte:
		inByte = SERIAL_PORT.read();
		stateMachine(inByte);

		if(hasNewSerialPack){
			cameraServos.update(servoAngle);
			hasNewSerialPack = false;
			updateThrottleAndSteering();
		}
	}
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
			state = READ_THROTTLE;
		}
		break;
	case READ_THROTTLE:
		if(newbyte == START_BYTE){
			state = INITIAL_STATE;
		}else {
			throttle_temp = newbyte;
			state = READ_STEERING;
		}
		break;
	case READ_STEERING:
		if(newbyte == START_BYTE){
			state = INITIAL_STATE;
		}else {
			steering_temp = newbyte;
			state = READ_STEERING;
			hasNewSerialPack = true;
			//State Machine cycle is complete
			state = INITIAL_STATE;
		}
		break;
	default:
		state = INITIAL_STATE;
		break;
	}
}
void updateThrottleAndSteering(){
	throttle = map(throttle_temp, 0,254, -MAX_THROTTLE,MAX_THROTTLE);
	steering = map(steering_temp, 0,254, -MAX_STEERING,MAX_STEERING);
}