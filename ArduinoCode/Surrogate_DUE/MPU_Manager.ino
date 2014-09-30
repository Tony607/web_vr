/**
MPU6050 Manager
Wapper for MPU related functions and variables
*/
/**
Function to initialize MPU6050
Note: we don't use the default initialize() function api provided
*/
void initializeMPU(){
	// join I2C bus (I2Cdev library doesn't do this automatically)
#if I2CDEV_IMPLEMENTATION == I2CDEV_ARDUINO_WIRE
	Wire.begin();
	//TWBR = 24; // 400kHz I2C clock (200kHz if CPU is 8MHz)
#elif I2CDEV_IMPLEMENTATION == I2CDEV_BUILTIN_FASTWIRE
	Fastwire::setup(400, true);
#endif
#ifdef DEBUG_LOG
	SERIAL_PORT.println(F("Initializing I2C devices..."));
#endif
	mpu.initialize();
	//mpu.setClockSource(MPU6050_CLOCK_PLL_ZGYRO);
	//mpu.setFullScaleGyroRange(MPU6050_GYRO_FS_2000);
	//mpu.setFullScaleAccelRange(MPU6050_ACCEL_FS_2);
	//mpu.setDLPFMode(MPU6050_DLPF_BW_20);  //10,20,42,98,188
	//mpu.setRate(4);   // 0=1khz 1=500hz, 2=333hz, 3=250hz 4=200hz
	//mpu.setSleepEnabled(false);

	// verify connection
#ifdef DEBUG_LOG
	SERIAL_PORT.println(F("Testing device connections..."));
	SERIAL_PORT.println(mpu.testConnection() ? F("MPU6050 connection successful") : F("MPU6050 connection failed"));
	// wait for ready
	SERIAL_PORT.println(F("\nSend any character to begin DMP programming and demo: "));
	while (SERIAL_PORT.available() && SERIAL_PORT.read()); // empty buffer
	while (!SERIAL_PORT.available());                 // wait for data
	while (SERIAL_PORT.available() && SERIAL_PORT.read()); // empty buffer again
	// load and configure the DMP
	SERIAL_PORT.println(F("Initializing DMP..."));
#endif
	devStatus = mpu.dmpInitialize();

	// supply your own gyro offsets here, scaled for min sensitivity
	mpu.setXGyroOffset(-43);  //220
	mpu.setYGyroOffset(-23);  //76
	mpu.setZGyroOffset(40);  //-85
	mpu.setZAccelOffset(1835); // 1688 factory default for my test chip

	// make sure it worked (returns 0 if so)
	if (devStatus == 0) {
		// turn on the DMP, now that it's ready
#ifdef DEBUG_LOG
		SERIAL_PORT.println(F("Enabling DMP..."));
#endif
		mpu.setDMPEnabled(true);

#ifdef DEBUG_LOG
		// enable Arduino interrupt detection
		SERIAL_PORT.println(F("Enabling interrupt detection (Arduino external interrupt 0)..."));
#endif
		attachInterrupt(MPU_INT_PIN, dmpDataReady, RISING);
		mpuIntStatus = mpu.getIntStatus();

		// set our DMP Ready flag so the main loop() function knows it's okay to use it
#ifdef DEBUG_LOG
		SERIAL_PORT.println(F("DMP ready! Waiting for first interrupt..."));
#endif
		dmpReady = true;

		// get expected DMP packet size for later comparison
		packetSize = mpu.dmpGetFIFOPacketSize();
	} else {
		// ERROR!
		// 1 = initial memory load failed
		// 2 = DMP configuration updates failed
		// (if it's going to break, usually the code will be 1)
#ifdef DEBUG_LOG
		SERIAL_PORT.print(F("DMP Initialization failed (code "));
		SERIAL_PORT.print(devStatus);
		SERIAL_PORT.println(F(")"));
#endif
	}
}

// DMP FUNCTIONS
// This function defines the weight of the accel on the sensor fusion
// default value is 0x80
// The official invensense name is inv_key_0_96 (??)
void dmpSetSensorFusionAccelGain(uint8_t gain)
{
#ifdef DEBUG_LOG
	SERIAL_PORT.println("Adjusting DMP sensor fusion gain...");
#endif
	// INV_KEY_0_96
	mpu.setMemoryBank(0);
	mpu.setMemoryStartAddress(0x60);
	mpu.writeMemoryByte(0);
	mpu.writeMemoryByte(gain);
	mpu.writeMemoryByte(0);
	mpu.writeMemoryByte(0);
}

// ================================================================
// ===               INTERRUPT DETECTION ROUTINE                ===
// ================================================================

void dmpDataReady() {
	mpuInterrupt = true;
}

// Quick calculation to obtein Phi angle from quaternion solution
float dmpGetPhi() {
	//return( asin(-2*(q.x * q.z - q.w * q.y)) * 180/M_PI); //roll
	return (atan2(2*(q.y * q.z + q.w * q.x), q.w * q.w - q.x * q.x - q.y * q.y + q.z * q.z)* RAD2GRAD);
}

void processNewDMPQuaternion(){

	angle_adjusted_Old = angle_adjusted;
	angle_adjusted = dmpGetPhi();


	// We calculate the estimated robot speed
	// Speed = angular_velocity_of_stepper_motors - angular_velocity_of_robot(angle measured by IMU)
	actual_robot_speed_Old = actual_robot_speed;
	actual_robot_speed = (speed_m[1] - speed_m[0])/2;  // Positive: forward

	int16_t angular_velocity = (angle_adjusted-angle_adjusted_Old)*90.0;     // 90 is an empirical extracted factor to adjust for real units
	int16_t estimated_speed = actual_robot_speed_Old - angular_velocity;     // We use robot_speed(t-1) or (t-2) to compensate the delay
	estimated_speed_filtered = estimated_speed_filtered*0.95 + (float)estimated_speed*0.05;
	//target_angle = (target_angle + speedPControl(estimated_speed_filtered,throttle,Kp_thr))/2.0;   // Some filtering : Average with previous output
	//target_angle = target_angle*0.3 + speedPIControl(dt,estimated_speed_filtered,throttle,Kp_thr,Ki_thr)*0.7;   // Some filtering 
	timer_value = millis();
	dt = (timer_value-timer_old);
	timer_old = timer_value;
	target_angle = speedPIControl(dt,estimated_speed_filtered,throttle,Kp_thr,Ki_thr); 
	target_angle = constrain(target_angle,-max_target_angle,max_target_angle);   // limited output



	if (pushUp_counter>0)  // pushUp mode?
		target_angle = 10;

	// We integrate the output (acceleration)
	control_output += stabilityPDControl(dt,angle_adjusted,target_angle,Kp,Kd);	
	//if(parse == PIDVAL){
	//	String output = String("new P=")+String(Kp_user)+String("\tnew D=")+String(Kd_user)+String("#");
	//	SERIAL_PORT.println(output);
	//}
	control_output = constrain(control_output,-500,500);   // Limit max output from control


	// The steering part of the control is injected directly on the output
	motor1 = control_output + steering;
	motor2 = -control_output + steering;   // Motor 2 is inverted

	// Limit max speed
	motor1 = constrain(motor1,-500,500);   
	motor2 = constrain(motor2,-500,500);

	// Is robot ready (upright?)
	if ((angle_adjusted<74)&&(angle_adjusted>-74))
	{
		// NORMAL MODE
		setMotorSpeed(0,motor1);
		setMotorSpeed(1,motor2);
		pushUp_counter=0;

		if ((angle_adjusted<40)&&(angle_adjusted>-40))
		{
			Kp = Kp_user;  // Default or user control gains
			Kd = Kd_user; 
			Kp_thr = Kp_thr_user;
			Ki_thr = Ki_thr_user;
		}     
		else
		{
			Kp = KP_RAISEUP;   // CONTROL GAINS FOR RAISE UP
			Kd = KD_RAISEUP;
			Kp_thr = KP_THROTTLE_RAISEUP; 
			Ki_thr = KI_THROTTLE_RAISEUP;
		}   
	}
	else   // Robot not ready, angle > 70º
	{
		setMotorSpeed(0,0);
		setMotorSpeed(1,0);
		PID_errorSum = 0;  // Reset PID I term
		Kp = KP_RAISEUP;   // CONTROL GAINS FOR RAISE UP
		Kd = KD_RAISEUP;
		Kp_thr = KP_THROTTLE_RAISEUP;
		Ki_thr = KI_THROTTLE_RAISEUP;

	} // New IMU data
}