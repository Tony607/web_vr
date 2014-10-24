// B-ROBOT  SELF BALANCE ROBOT WITH STEPPER MOTORS
// Arduino Micro
// MPU6050 using DMP processor

// Angle calculations and control part is running at 200Hz from DMP solution
// DMP is using the gyro_bias_no_motion correction method.
// The board needs at least 10-15 seconds to give good values...

// STEPPER MOTOR PINS
// ENABLE PIN: D10
// STEP Motor1: D6 -> PORTD,7//change to D4--> PORTD,4
// DIR  Motor1: D7 -> PORTE,6
// STEP Motor2: D8-> PORTB,4
// DIR  Motor2: D9-> PORTB,5
// To control the stepper motors we use Timer1 interrupt running at 25Khz. We control the speed of the motors


// We use a standard PID control for robot stability
// We have a P control for speed control and a PD control for stability (robot angle)
// The output of the control (motor speed) is integrated so it´s really an acceleration

#include "Config.h"
#include "RangeFinder.h"
#include <PwmServo.h>
#include <Wire.h>
#include <I2Cdev.h>
#include <JJ_MPU6050_DMP_6Axis.h>  // Modified version of the library to work with DMP (see comments inside)

#define DEBUG 0

#define CLR(x,y) (x&=(~(1<<y)))
#define SET(x,y) (x|=(1<<y))

#define ZERO_SPEED 65535
#define MAX_ACCEL 7

#define MAX_THROTTLE 530
#define MAX_STEERING 136
#define MAX_TARGET_ANGLE 12

// PRO MODE = MORE AGGRESSIVE
#define MAX_THROTTLE_PRO 650
#define MAX_STEERING_PRO 240 
#define MAX_TARGET_ANGLE_PRO 18


//#define I2C_SPEED 100000L
#define I2C_SPEED 400000L
//#define I2C_SPEED 800000L

#define ACCEL_SCALE_G 8192             // (2G range) G = 8192
#define ACCEL_WEIGHT 0.01
#define GYRO_BIAS_WEIGHT 0.005

// MPU6000 sensibility   (0.0609 => 1/16.4LSB/deg/s at 2000deg/s, 0.03048 1/32.8LSB/deg/s at 1000deg/s)
#define Gyro_Gain 0.03048
#define Gyro_Scaled(x) x*Gyro_Gain //Return the scaled gyro raw data in degrees per second

#define RAD2GRAD 57.2957795
#define GRAD2RAD 0.01745329251994329576923690768489

// Default control terms   
#define KP 0.20 // 0.22        
#define KD 26   // 30 28        
#define KP_THROTTLE 0.065  //0.08
#define KI_THROTTLE 0.05

// Control gains for raiseup
#define KP_RAISEUP 0.16
#define KD_RAISEUP 40
#define KP_THROTTLE_RAISEUP 0  // No speed control on raiseup
#define KI_THROTTLE_RAISEUP 0.0


#define ITERM_MAX_ERROR 40   // Iterm windup constants
#define ITERM_MAX 5000

#define OBSTACLE_DISTANCE_MIN 36
#define WALK_DISTANCE_MIN 76


int16_t pushUp_counter;  // for pushUp functionality (experimental)


// MPU control/status vars
bool dmpReady = false;  // set true if DMP init was successful
uint8_t mpuIntStatus;   // holds actual interrupt status byte from MPU
uint8_t devStatus;      // return status after each device operation (0 = success, !0 = error)
uint16_t packetSize;    // expected DMP packet size (for us 18 bytes)
uint16_t fifoCount;     // count of all bytes currently in FIFO
uint8_t fifoBuffer[18]; // FIFO storage buffer
Quaternion q;

uint8_t loop_counter;       // To generate a medium loop 40Hz 
uint8_t slow_loop_counter;  // slow loop 2Hz
//count the continuous time motors are running at the max speed
uint8_t stopCounter = 0;
unsigned char getUpstate = 0;
//Indicate the motor is stopped because if freewheel running
bool stopMotorFreeWheel = false;
long timer_old;
long timer_value;
float dt;

// class default I2C address is 0x68
MPU6050 mpu;
//instantiate the three camera servos
PwmServo cameraServos;
//the array for setting servo angles, they are mapped angles, not the actual angles
unsigned char servoAngle[3];
unsigned char throttle_temp;
unsigned char steering_temp;
//those are variable used in the SerialDataParser.ino
int inByte = 0;         // incoming serial byte
unsigned char state = 0;
bool hasNewSerialPack = false;
//
float angle_adjusted;
float angle_adjusted_Old;

float Kp=KP;
float Kd=KD;
float Kp_thr=KP_THROTTLE;
float Ki_thr=KI_THROTTLE;
float Kp_user=KP;
float Kd_user=KD;
float Kp_thr_user=KP_THROTTLE;
float Ki_thr_user=KI_THROTTLE;
bool newControlParameters = false;
bool modifing_control_parameters=false;
float PID_errorSum;
float PID_errorOld = 0;
float PID_errorOld2 = 0;
float setPointOld = 0;
float target_angle;
float throttle;
float steering;
float max_throttle = MAX_THROTTLE;
float max_steering = MAX_STEERING;
float max_target_angle = MAX_TARGET_ANGLE;
float control_output;
int16_t motor1;
int16_t motor2;

int16_t speed_m[2];           // Actual speed of motors
uint8_t dir_m[2];             // Actual direction of steppers motors
int16_t actual_robot_speed;          // overall robot speed (measured from steppers speed)
int16_t actual_robot_speed_Old;          // overall robot speed (measured from steppers speed)
float estimated_speed_filtered;

uint16_t counter_m[2];        // counters for periods
uint16_t period_m[2][8];      // Eight subperiods 
uint8_t period_m_index[2];    // index for subperiods

void setup() 
{ 
	// STEPPER PINS 
	initializeRangeSensor();
	pinMode(M_EN,OUTPUT);  // ENABLE MOTORS
	pinMode(M1_STEP,OUTPUT);  // STEP MOTOR 1 PORTD,7
	pinMode(M1_DIR,OUTPUT);  // DIR MOTOR 1
	pinMode(M2_STEP,OUTPUT); // STEP MOTOR 2 PORTD,6
	pinMode(M2_DIR,OUTPUT); // DIR MOTOR 2
	pinMode(DEBUG,OUTPUT); // Debug pin
	digitalWrite(M_EN,HIGH);   // Disbale motors

	digitalWrite(DEBUG,HIGH);   // Debug pin
	//initialize the servos
	cameraServos.init();

	SERIAL_PORT.begin(115200);
	// Join I2C bus
	Wire.begin();
	// 4000Khz fast mode
	TWSR = 0;
	TWBR = ((16000000L/I2C_SPEED)-16)/2;
	TWCR = 1<<TWEN;

	SERIAL_PORT.println("Initializing I2C devices...");
	//mpu.initialize();
	mpu.setClockSource(MPU6050_CLOCK_PLL_ZGYRO);
	mpu.setFullScaleGyroRange(MPU6050_GYRO_FS_2000);
	mpu.setFullScaleAccelRange(MPU6050_ACCEL_FS_2);
	mpu.setDLPFMode(MPU6050_DLPF_BW_20);  //10,20,42,98,188
	mpu.setRate(4);   // 0=1khz 1=500hz, 2=333hz, 3=250hz 4=200hz
	mpu.setSleepEnabled(false);

	delay(2000);
	SERIAL_PORT.println(F("Initializing DMP..."));
	devStatus = mpu.dmpInitialize();
	if (devStatus == 0) {
		// turn on the DMP, now that it's ready
		SERIAL_PORT.println(F("Enabling DMP..."));
		mpu.setDMPEnabled(true);
		mpuIntStatus = mpu.getIntStatus();
		dmpReady = true;

	} else { // ERROR!
		// 1 = initial memory load failed
		// 2 = DMP configuration updates failed
		// (if it's going to break, usually the code will be 1)
		SERIAL_PORT.print(F("DMP Initialization failed (code "));
		SERIAL_PORT.print(devStatus);
		SERIAL_PORT.println(F(")"));
	}

	// Gyro calibration
	// The robot must be steady during initialization
	delay(15000);   // Time to settle things... the bias_from_no_motion algorithm needs some time to take effect and reset gyro bias.

	SERIAL_PORT.print("Free RAM: ");
	SERIAL_PORT.println(freeRam());
	SERIAL_PORT.print("Max_throttle: ");
	SERIAL_PORT.println(max_throttle);
	SERIAL_PORT.print("Max_steering: ");
	SERIAL_PORT.println(max_steering);
	SERIAL_PORT.print("Max_target_angle: ");
	SERIAL_PORT.println(max_target_angle);

	// verify connection
	SERIAL_PORT.println("Testing device connections...");
	SERIAL_PORT.println(mpu.testConnection() ? "MPU6050 connection successful" : "MPU6050 connection failed");
	timer_old = millis();
	//setup the sonar range sensor to use Timer 1 capture
	initializeRangeSensor();
	//We are going to overwrite the Timer3 to use the stepper motors

	// STEPPER MOTORS INITIALIZATION
	// TIMER3 CTC MODE
	TCCR3B &= ~(1<<WGM33);
	TCCR3B |=  (1<<WGM32);
	TCCR3A &= ~(1<<WGM31); 
	TCCR3A &= ~(1<<WGM30);

	// output mode = 00 (disconnected)
	TCCR3A &= ~(3<<COM3A0); 
	TCCR3A &= ~(3<<COM3B0); 

	// Set the timer pre-scaler
	// Generally we use a divider of 8, resulting in a 2MHz timer on 16MHz CPU
	TCCR3B = (TCCR3B & ~(0x07<<CS30)) | (2<<CS30);

	//OCR3A = 125;  // 16Khz
	//OCR3A = 100;  // 20Khz
	OCR3A = 80;   // 25Khz
	TCNT3 = 0;

	delay(2000);

	//Adjust sensor fusion gain
	SERIAL_PORT.println("Adjusting DMP sensor fusion gain...");
	dmpSetSensorFusionAccelGain(0x20);

	SERIAL_PORT.println("Initializing Stepper motors...");
	delay(1000);
	TIMSK3 |= (1<<OCIE3A);  // Enable Timer1 interrupt
	digitalWrite(M_EN,LOW);    // Enable stepper drivers

	// Little motor vibration to indicate that robot is ready
	for (uint8_t k=0;k<3;k++)
	{
		setMotorSpeed(0,3);
		setMotorSpeed(1,-3);
		delay(150);
		setMotorSpeed(0,-3);
		setMotorSpeed(1,3);
		delay(150);
	}


	mpu.resetFIFO();
	timer_old = millis();
}


// Main loop
void loop() 
{   
	digitalWrite(DEBUG,HIGH);//debug pin
	serialDataParser();
	/*uint8_t parse = parseLenProto();
	if(parse == CONTROLVAL){
	throttle = constrain(getThrottle(),-MAX_THROTTLE,MAX_THROTTLE);
	steering = constrain(getSteering(),-MAX_STEERING,MAX_STEERING);
	} else if(parse == PIDVAL){
	Kp_user = constrain(getP()*SAFEMAXKP/100.0,0,SAFEMAXKP);
	Kd_user = constrain(getD()*SAFEMAXKD/100.0,0,SAFEMAXKD);
	}*/
	timer_value = millis();//overflow (go back to zero), after approximately 50 days
	// New DMP Orientation solution?
	fifoCount = mpu.getFIFOCount();
	if (fifoCount>=18)//this loop is about 200Hz close to the MPU6050 data feed frequency
	{
		if (fifoCount>18)  // If we have more than one packet we take the easy path: discard the buffer 
		{
			SERIAL_PORT.println("FIFO RESET!!");
			mpu.resetFIFO();
			return;
		}
		loop_counter++;
		slow_loop_counter++;
		dt = (timer_value-timer_old);
		timer_old = timer_value;

		angle_adjusted_Old = angle_adjusted;
		angle_adjusted = dmpGetPhi();

#if DEBUG==8
		SERIAL_PORT.print(throttle);
		SERIAL_PORT.print(" ");
		SERIAL_PORT.print(steering);
		SERIAL_PORT.print(" ");
		SERIAL_PORT.println(mode);
#endif

		//angle_adjusted_radians = angle_adjusted*GRAD2RAD;
#if DEBUG==1
		SERIAL_PORT.println(angle_adjusted);
#endif
		//SERIAL_PORT.print("\t");
		mpu.resetFIFO();  // We always reset FIFO


		// We calculate the estimated robot speed
		// Speed = angular_velocity_of_stepper_motors - angular_velocity_of_robot(angle measured by IMU)
		actual_robot_speed_Old = actual_robot_speed;
		actual_robot_speed = (speed_m[1] - speed_m[0])/2;  // Positive: forward

		int16_t angular_velocity = (angle_adjusted-angle_adjusted_Old)*90.0;     // 90 is an empirical extracted factor to adjust for real units
		int16_t estimated_speed = actual_robot_speed_Old - angular_velocity;     // We use robot_speed(t-1) or (t-2) to compensate the delay
		estimated_speed_filtered = estimated_speed_filtered*0.95 + (float)estimated_speed*0.05;
#if DEBUG==2
		SERIAL_PORT.print(" ");
		SERIAL_PORT.println(estimated_speed_filtered);
#endif

		//target_angle = (target_angle + speedPControl(estimated_speed_filtered,throttle,Kp_thr))/2.0;   // Some filtering : Average with previous output
		//target_angle = target_angle*0.3 + speedPIControl(dt,estimated_speed_filtered,throttle,Kp_thr,Ki_thr)*0.7;   // Some filtering 
		target_angle = speedPIControl(dt,estimated_speed_filtered,throttle,Kp_thr,Ki_thr); 
		target_angle = constrain(target_angle,-max_target_angle,max_target_angle);   // limited output

#if DEBUG==3
		SERIAL_PORT.print(" ");SERIAL_PORT.println(estimated_speed_filtered);
		SERIAL_PORT.print(" ");SERIAL_PORT.println(target_angle);
#endif


		if (pushUp_counter>0)  // pushUp mode?
			target_angle = 10;

		// We integrate the output (acceleration)
		control_output += stabilityPDControl(dt,angle_adjusted,target_angle,Kp,Kd);	
		/*if(parse == PIDVAL){
		String output = String("new P=")+String(Kp_user)+String("\tnew D=")+String(Kd_user)+String("#");
		SERIAL_PORT.println(output);
		}*/
		control_output = constrain(control_output,-MAX_MOTOR_SPEED,MAX_MOTOR_SPEED);   // Limit max output from control


		// The steering part of the control is injected directly on the output
		motor1 = control_output + steering;
		motor2 = -control_output + steering;   // Motor 2 is inverted

		// Limit max speed
		motor1 = constrain(motor1,-MAX_MOTOR_SPEED,MAX_MOTOR_SPEED);   
		motor2 = constrain(motor2,-MAX_MOTOR_SPEED,MAX_MOTOR_SPEED);

		// Is robot ready (upright?)
		if ((angle_adjusted<MAX_UPRIGHT_ANGLE)&&(angle_adjusted>-MAX_UPRIGHT_ANGLE)&&(!stopMotorFreeWheel))
		{
			// NORMAL MODE
			setMotorSpeed(0,motor1);
			setMotorSpeed(1,motor2);
			pushUp_counter=0;

			if ((angle_adjusted<RISING_UP)&&(angle_adjusted>-RISING_UP))
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
		else   // Robot not ready, angle > MAX_UPRIGHT_ANGLE
		{
			stopAndResetMotors();
			//Kp = KP_RAISEUP;   // CONTROL GAINS FOR RAISE UP
			//Kd = KD_RAISEUP;
			//Kp_thr = KP_THROTTLE_RAISEUP;
			//Ki_thr = KI_THROTTLE_RAISEUP;

		} // New IMU data

		// Medium loop 50Hz = 200Hz/4
		if (loop_counter >= 4) 
		{
			loop_counter = 0;
			printRobotQuaternion();
			toggleTrigPin();
		} // Medium loop

		if (slow_loop_counter>=20)  // 10Hz <= 200Hz/20
		{
			if(control_output>=MAX_MOTOR_SPEED || control_output<=-MAX_MOTOR_SPEED){
				stopCounter++;//increase the counter if the motor is running at max speed
			} else if(stopCounter<Max_FreeWheel_Count){
				stopCounter=0;//reset the counter if the motor come back to mormal running speed
			} else 
				if(getUpStateMachine()){//Motor is stopped, detect the trigger to restart
					stopCounter = 0;
				}

				//stop the motor for the freewheel run
				if(stopCounter>= Max_FreeWheel_Count){
					stopCounter = Max_FreeWheel_Count;
					stopMotorFreeWheel = true;
				}else{
					stopMotorFreeWheel = false;
				}

				slow_loop_counter = 0;
		}  // Slow loop
	}
	digitalWrite(DEBUG,LOW);//debug pin
}
