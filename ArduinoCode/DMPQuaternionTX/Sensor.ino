
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