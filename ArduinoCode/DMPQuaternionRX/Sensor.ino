
// DMP FUNCTIONS
// This function defines the weight of the accel on the sensor fusion
// default value is 0x80
// The official invensense name is inv_key_0_96 (??)
void dmpSetSensorFusionAccelGain(uint8_t gain)
{
	// INV_KEY_0_96
	mpu.setMemoryBank(0);
	mpu.setMemoryStartAddress(0x60);
	mpu.writeMemoryByte(0);
	mpu.writeMemoryByte(gain);
	mpu.writeMemoryByte(0);
	mpu.writeMemoryByte(0);
}

// Quick calculation to obtein Phi angle from quaternion solution
void dmpReadQuaternionToq() {
	mpu.getFIFOBytes(fifoBuffer, 16); // We only read the quaternion
	mpu.dmpGetQuaternion(&q, fifoBuffer); 
	mpu.resetFIFO();
}
void printQuaternion(){	
	//bytes array to send to serial port
	uint8_t bytesArray[6] = {0x00,0x00,0x00,0x00,0x00,0xFF};
	//id = 0
	bytesArray[0] = 0x00;
	bytesArray[1] = (uint8_t)((q.x+1)*127);
	bytesArray[2] = (uint8_t)((q.y+1)*127);
	bytesArray[3] = (uint8_t)((q.z+1)*127);
	bytesArray[4] = (uint8_t)((q.w+1)*127);
	SERIAL_PORT.write(bytesArray,6);
}
void printAnyQuaternion(Quaternion quternion, uint16_t addr){
	uint8_t bytesArray[6] = {0x00,0x00,0x00,0x00,0x00,0xFF};
	//id = 0
	bytesArray[0] = addr&0xFF;
	bytesArray[1] = (uint8_t)((quternion.x+1)*127);
	bytesArray[2] = (uint8_t)((quternion.y+1)*127);
	bytesArray[3] = (uint8_t)((quternion.z+1)*127);
	bytesArray[4] = (uint8_t)((quternion.w+1)*127);
	SERIAL_PORT.write(bytesArray,6);
}