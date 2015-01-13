
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
	QuaternionCompact q_compact = QuaternionCompact(q);
	if(!q_compact_his.isEqualTo(q_compact)){
		q_compact_his = q_compact;
		//bytes array to send to serial port
		uint8_t bytesArray[6] = {0x00,0x00,0x00,0x00,0x00,0xFF};
		bytesArray[0] = 0x00;
		bytesArray[1] = q_compact.x;
		bytesArray[2] = q_compact.y;
		bytesArray[3] = q_compact.z;
		bytesArray[4] = q_compact.w;
		Serial.write(bytesArray,6);
	}
}
void printAnyQuaternion(QuaternionCompact quternion, uint16_t addr){
	uint8_t bytesArray[6] = {0x00,0x00,0x00,0x00,0x00,0xFF};
	//id = 0
	bytesArray[0] = addr&0xFF;
	bytesArray[1] = quternion.x;
	bytesArray[2] = quternion.y;
	bytesArray[3] = quternion.z;
	bytesArray[4] = quternion.w;
	Serial.write(bytesArray,6);
}
/**Glove node is a virtual node that use Quaternion as a container for the actual data
it only use Quaternion.x, that is 4 bytes
TODO: we can experiment shrink the send buffer by 2 because the current glove node only uses
the the first 2 bytes in the quternion.x float
*/
void printGloveNode(QuaternionCompact quternion, uint16_t addr){
	uint8_t bytesArray[6] = {0x00,0x00,0x00,0x00,0x00,0xFF};
	//copy the float(quternion.x) 4 bytes data to the bytesArray with offset 1,
	//which means it will overwrite bytesArray index 1,2,3,4
	memcpy(bytesArray+1, &quternion.x,  4 );
	//address
	bytesArray[0] = addr&0xFF;
	Serial.write(bytesArray,6);

	//TODO: Uncomment this block bellow to test the shrinked glove node frame, comment the previous lines in the the function
	/*
	uint8_t bytesArray[4] = {0x00,0x00,0x00,0xFF};
	//copy the float(quternion.x) first 2 bytes of the 4 bytes data to the bytesArray with offset 1,
	//which means it will overwrite bytesArray index 1,2
	memcpy(bytesArray+1, &quternion.x,  2 );
	//address
	bytesArray[0] = addr&0xFF;
	Serial.write(bytesArray,4);
	*/
}