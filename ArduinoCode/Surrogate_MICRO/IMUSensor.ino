
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
float dmpGetPhi() {
	mpu.getFIFOBytes(fifoBuffer, 16); // We only read the quaternion
	mpu.dmpGetQuaternion(&q, fifoBuffer); 
	mpu.resetFIFO();  // We always reset FIFO

	//return( asin(-2*(q.x * q.z - q.w * q.y)) * 180/M_PI); //roll
	return (atan2(2*(q.y * q.z + q.w * q.x), q.w * q.w - q.x * q.x - q.y * q.y + q.z * q.z)* RAD2GRAD);
}
