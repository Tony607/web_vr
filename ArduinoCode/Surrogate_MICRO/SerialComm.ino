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
#ifdef HAS_PUSHUP_SERVO
			if(pushup_temp==0){
				Timer1.stop();
			}else
				if(pushup_temp==1){
					Timer1.resume();
				}else{
					Timer1.setPwmDuty(pushup_temp);//0~1023
				}
#endif
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


#ifdef HAS_PUSHUP_SERVO
	case READ_STEERING:
		if(newbyte == START_BYTE){
			state = INITIAL_STATE;
		}else {
			steering_temp = newbyte;
			state = READ_SERVO_P;
		}
		break;
	
	case READ_SERVO_P:
		if(newbyte == START_BYTE){
			state = INITIAL_STATE;
		}else {
			pushup_temp = newbyte;
			state = READ_CHECKSUM;
		}
		break;
	case READ_CHECKSUM:
		if(newbyte == START_BYTE){
			state = INITIAL_STATE;
		}else {
			if(checksum((int)newbyte)){
				hasNewSerialPack = true;
			}
			//State Machine cycle is complete
			state = INITIAL_STATE;
		}
		break;
#else
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

#endif
	default:
		state = INITIAL_STATE;
		break;
	}
}
/**function to verify the incoming serial data*/
bool checksum(int correctValue){
	int checksum = servoAngle[0]+servoAngle[1]+servoAngle[2]+throttle_temp+steering_temp+pushup_temp;
	checksum = checksum & 0xFE;
	if(correctValue == checksum){
		return true;
	}else{
		return false;
	}
}
void updateThrottleAndSteering(){
	updateThrottle(throttle_temp);
	//throttle = map(throttle_temp, 0,254, -MAX_THROTTLE,MAX_THROTTLE);
	steering = map(steering_temp, 0,254, -MAX_STEERING,MAX_STEERING);
	//clear the flag to tell the 50Hz loop not to caclulate the throttle again
	//needUpdateThrottle = false;
}
/**
function to send the mpu quaternion to serial port 
format: x,y,z,w,0xFF
*/
void printRobotQuaternion(){	
	//bytes array to send to serial port
	uint8_t bytesArray[5] = {0x00,0x00,0x00,0x00,0xFF};
	//id = 0
	bytesArray[0] = (uint8_t)((q.x+1)*127);
	bytesArray[1] = (uint8_t)((q.y+1)*127);
	bytesArray[2] = (uint8_t)((q.z+1)*127);
	bytesArray[3] = (uint8_t)((q.w+1)*127);
	SERIAL_PORT.write(bytesArray,5);
}



/**
function to data to serial port 
Robot Quaternion, Horizontal distance and control_output of the motor
format: x,y,z,w,0xFF
*/
void printRobotQuaternionAndDistanceAndControlOutput(){	

	//remap control_output to a byte
	//uint8_t output_ser = 0;
	//if(control_output>381){
	//	output_ser = 0;
	//}else if(control_output<-381){
	//	output_ser = 254;
	//}else{
	//	output_ser = -control_output/3+127;
	//}
	int output_ser = -(float)control_output*0.4+51;
	if(output_ser>254){
		output_ser = 254;
	} else if(output_ser<0){
		output_ser = 0;
	}
	//bytes array to send to serial port
	uint8_t bytesArray[7] = {0x00,0x00,0x00,0x00,0x00,0x00,0xFF};
	//note: the quaternion and distance represents the most recent value,
	//which means that are not get at the the same time, so avoid using the caluclated
	//pitch angle from quaternion and horizontalDistance to calculate
	//the raw pulsewidth on the server side.
	bytesArray[0] = (uint8_t)((q.x+1)*127);
	bytesArray[1] = (uint8_t)((q.y+1)*127);
	bytesArray[2] = (uint8_t)((q.z+1)*127);
	bytesArray[3] = (uint8_t)((q.w+1)*127);
#ifdef USE_SONAR
	bytesArray[4] = (uint8_t)(horizontalDistance);
#endif
#ifdef USE_IR
	bytesArray[4] = readDistanceIR();
#endif
	bytesArray[5] = (uint8_t)output_ser;
	SERIAL_PORT.write(bytesArray,7);
}
