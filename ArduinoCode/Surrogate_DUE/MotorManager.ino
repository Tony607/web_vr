/**
Stepper Motor Manager
Wapper for Stepper Motor related functions and variables
*/

// Set up Stepper Motors' PINS
void setupStepperMotorPins(){
	// STEPPER PINS 
	pinMode(M_EN,OUTPUT);  // ENABLE MOTORS
	pinMode(M1_STEP,OUTPUT);
	pinMode(M1_DIR,OUTPUT);
	pinMode(M2_STEP,OUTPUT);
	pinMode(M2_DIR,OUTPUT);
	digitalWrite(M_EN,HIGH);   // Disbale motors
}
//set up the Timer 3 interrupt for the stepper motors
void initializeStepperMotor(){
#ifdef DEBUG_LOG
	SERIAL_PORT.println("initializeStepperMotor()");
#endif
	//40us 25KHz interrput
	Timer8.attachInterrupt(Timer3StepperInterrupt).start(40); // Every 40us
}

void Timer3StepperInterrupt(){

	// blink LED to indicate activity
	counter_m[0]++;
	counter_m[1]++;
	if (counter_m[0] >= period_m[0][period_m_index[0]])
	{
		counter_m[0] = 0;
		if (period_m[0][0]==ZERO_SPEED)
			return;
		if (dir_m[0])
			digitalWrite(M1_DIR, 1);
		else
			digitalWrite(M1_DIR, 0);
		// We need to wait at lest 200ns to generate the Step pulse...
		period_m_index[0] = (period_m_index[0]+1)&0x07; // period_m_index from 0 to 7
		//delay_200ns();
		digitalWrite(M1_STEP, 1); // STEP Motor 1
		//delayMicroseconds(1);
		digitalWrite(M1_STEP, 0);
	}
	if (counter_m[1] >= period_m[1][period_m_index[1]])
	{
		counter_m[1] = 0;
		if (period_m[1][0]==ZERO_SPEED)
			return;
		if (dir_m[1])
			digitalWrite(M2_DIR, 1);
		else
			digitalWrite(M2_DIR, 0);
		period_m_index[1] = (period_m_index[1]+1)&0x07;
		digitalWrite(M2_STEP, 1); // STEP Motor 2
		//delayMicroseconds(1);
		digitalWrite(M2_STEP, 0);
	}
}


// PD implementation. DT is in miliseconds
float stabilityPDControl(float DT, float input, float setPoint,  float Kp, float Kd)
{
	float error;
	float output;

	error = setPoint-input;

	// Kd is implemented in two parts
	//    The biggest one using only the input (sensor) part not the SetPoint input-input(t-2)
	//    And the second using the setpoint to make it a bit more agressive   setPoint-setPoint(t-1)
	output = Kp*error + (Kd*(setPoint - setPointOld) - Kd*(input - PID_errorOld2))/DT;       // + error - PID_error_Old2
	//SERIAL_PORT.print(Kd*(error-PID_errorOld));SERIAL_PORT.print("\t");
	PID_errorOld2 = PID_errorOld;
	PID_errorOld = input;  // error for Kd is only the input component
	setPointOld = setPoint;
	return(output);
}

// P control implementation.
float speedPControl(float input, float setPoint,  float Kp)
{
	float error;

	error = setPoint-input;

	return(Kp*error);
}

// PI implementation. DT is in miliseconds
float speedPIControl(float DT, float input, float setPoint,  float Kp, float Ki)
{
	float error;
	float output;

	error = setPoint-input;
	PID_errorSum += constrain(error,-ITERM_MAX_ERROR,ITERM_MAX_ERROR);
	PID_errorSum = constrain(PID_errorSum,-ITERM_MAX,ITERM_MAX);

	output = Kp*error + Ki*PID_errorSum*DT*0.001;
	return(output);
}
// Divided into 8 periods to increase the resolution at high speeds (short periods)
// subperiod = ((1000 % vel)*8)/vel;
// Examples 4 subperiods:
// 1000/260 = 3.84  subperiod = 3
// 1000/240 = 4.16  subperiod = 0
// 1000/220 = 4.54  subperiod = 2
// 1000/300 = 3.33  subperiod = 1 
void calculateSubperiods(uint8_t motor)
{
	int subperiod;
	int absSpeed;
	uint8_t j;

	if (speed_m[motor] == 0)
	{
		for (j=0;j<8;j++)
			period_m[motor][j] = ZERO_SPEED;
		return;
	}
	if (speed_m[motor] > 0 )   // Positive speed
	{
		dir_m[motor] = 1;
		absSpeed = speed_m[motor];
	}
	else                       // Negative speed
	{
		dir_m[motor] = 0;
		absSpeed = -speed_m[motor];
	}

	for (j=0;j<8;j++)
		period_m[motor][j] = 1000/absSpeed;
	// Calculate the subperiod. if module <0.25 => subperiod=0, if module < 0.5 => subperiod=1. if module < 0.75 subperiod=2 else subperiod=3
	subperiod = ((1000 % absSpeed)*8)/absSpeed;   // Optimized code to calculate subperiod (integer math)
	if (subperiod>0)
		period_m[motor][1]++;
	if (subperiod>1)
		period_m[motor][5]++;
	if (subperiod>2)
		period_m[motor][3]++;
	if (subperiod>3)
		period_m[motor][7]++;
	if (subperiod>4)
		period_m[motor][0]++;
	if (subperiod>5)
		period_m[motor][4]++;
	if (subperiod>6)
		period_m[motor][2]++;

	// DEBUG
	/*
	if ((motor==0)&&((debug_counter%10)==0)){
	SERIAL_PORT.print(1000.0/absSpeed);SERIAL_PORT.print("\t");SERIAL_PORT.print(absSpeed);SERIAL_PORT.print("\t");
	SERIAL_PORT.print(period_m[motor][0]);SERIAL_PORT.print("-");
	SERIAL_PORT.print(period_m[motor][1]);SERIAL_PORT.print("-");
	SERIAL_PORT.print(period_m[motor][2]);SERIAL_PORT.print("-");
	SERIAL_PORT.println(period_m[motor][3]);
	}
	*/  
}
void setMotorSpeed(uint8_t motor, int16_t tspeed)
{
	// WE LIMIT MAX ACCELERATION
	if ((speed_m[motor] - tspeed)>MAX_ACCEL)
		speed_m[motor] -= MAX_ACCEL;
	else if ((speed_m[motor] - tspeed)<-MAX_ACCEL)
		speed_m[motor] += MAX_ACCEL;
	else
		speed_m[motor] = tspeed;

	calculateSubperiods(motor);  // We use four subperiods to increase resolution

	// To save energy when its not running...
	if ((speed_m[0]==0)&&(speed_m[1]==0))
		digitalWrite(10,HIGH);   // Disable motors
	else
		digitalWrite(10,LOW);   // Enable motors
}
// Little motor vibration to indicate that robot is ready
void vibrateMotors(){
	digitalWrite(M_EN,LOW);    // Enable stepper drivers
	for (uint8_t k=0;k<3;k++)
	{
		setMotorSpeed(0,3);
		setMotorSpeed(1,-3);
		//delay(150);
		setMotorSpeed(0,-3);
		setMotorSpeed(1,3);
		//delay(150);
	}
}