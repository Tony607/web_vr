/**************
This is the main sketch for the embeded software of the balancing robot, part of the Surrogate project, 
The goal of the Surrogate project is to enable the immersive experience of telepresence

Hardware for this sketch:
Board: Arduino Due
3 servos for camera yaw, pitch, roll control
2 stepper motors to drive the balancing robot
MPU: MPU6050 to get the robot orientation
*************/
// I2Cdev and MPU6050 must be installed as libraries, or else the .cpp/.h files
// for both classes must be in the include path of your project
#include "I2Cdev.h"
//project config file
#include "Config.h"
//#include "MPU6050_6Axis_MotionApps20.h"
#include <JJ_MPU6050_DMP_6Axis.h>  // Modified version of the library to work with DMP (see comments inside)
//#include "MPU6050.h" // not necessary if using MotionApps include file
#include <Servo.h>
#include <DueTimer.h>
// Arduino Wire library is required if I2Cdev I2CDEV_ARDUINO_WIRE implementation
// is used in I2Cdev.h
#if I2CDEV_IMPLEMENTATION == I2CDEV_ARDUINO_WIRE
#include "Wire.h"
#endif
//we define all global variable in this file, include this file after including other files
#include "GlobalVars.h"

// ================================================================
// ===                      INITIAL SETUP                       ===
// ================================================================

void setup() {
	// configure LED for output
	pinMode(LED_PIN, OUTPUT);
	pinMode(DEBUG_PIN, OUTPUT);
	pinMode(DEBUG_PIN2, OUTPUT);
	setupStepperMotorPins();
	setupCamServos();
	// initialize Serial communication
	SERIAL_PORT.begin(BAUD_RATE);
	// initialize device
	initializeMPU();
	// Gyro calibration
	// The robot must be steady during initialization
	//delay(15000);   // Time to settle things... the bias_from_no_motion algorithm needs some time to take effect and reset gyro bias.
	initializeStepperMotor();
	//Adjust sensor fusion gain
	//dmpSetSensorFusionAccelGain(0x20);

	vibrateMotors();
	//mpu.resetFIFO();
	timer_old = millis();

}



// ================================================================
// ===                    MAIN PROGRAM LOOP                     ===
// ================================================================

void loop() {
	// if programming failed, don't try to do anything
	if (!dmpReady) return;

	// wait for MPU interrupt or extra packet(s) available
	digitalWrite(DEBUG_PIN2, 1);
	while (!mpuInterrupt && fifoCount < packetSize) {
		readAndUpdateServos();
		// other program behavior stuff here
		// .
		// .
		// .
		// if you are really paranoid you can frequently test in between other
		// stuff to see if mpuInterrupt is true, and if so, "break;" from the
		// while() loop to immediately process the MPU data
		// .
		// .
		// .
	}
	digitalWrite(DEBUG_PIN2, 0);

	// reset interrupt flag and get INT_STATUS byte
	mpuInterrupt = false;
	//use the LED PIN to toggle on an off, can use the OSC to get the time consumed by the funcion
	digitalWrite(LED_PIN, 1);
	mpuIntStatus = mpu.getIntStatus();

	// get current FIFO count
	fifoCount = mpu.getFIFOCount();

	// check for overflow (this should never happen unless our code is too inefficient)
	if ((mpuIntStatus & 0x10) || fifoCount == 1024) {
		// reset so we can continue cleanly
		mpu.resetFIFO();
		SERIAL_PORT.println(F("FIFO overflow!"));

		// otherwise, check for DMP data ready interrupt (this should happen frequently)
	} else if (mpuIntStatus & 0x02) {
		// wait for correct available data length, should be a VERY short wait
		while (fifoCount < packetSize) fifoCount = mpu.getFIFOCount();

		// read a packet from FIFO
		mpu.getFIFOBytes(fifoBuffer, packetSize);
		digitalWrite(LED_PIN, 0);

		// track FIFO count here in case there is > 1 packet available
		// (this lets us immediately read more without waiting for an interrupt)
		fifoCount -= packetSize;


		// display Euler angles in degrees
		mpu.dmpGetQuaternion(&q, fifoBuffer);
		digitalWrite(DEBUG_PIN, 1);
		processNewDMPQuaternion();

		//SERIAL_PORT.print("Q\t");
		//SERIAL_PORT.print(q.x);
		//SERIAL_PORT.print("\t");
		//SERIAL_PORT.print(q.y);
		//SERIAL_PORT.print("\t");
		//SERIAL_PORT.println(q.z);
		digitalWrite(DEBUG_PIN, 0);
		/*mpu.dmpGetGravity(&gravity, &q);
		mpu.dmpGetYawPitchRoll(ypr, &q, &gravity);
		SERIAL_PORT.print("ypr\t");
		SERIAL_PORT.print(ypr[0] * 180/M_PI);
		SERIAL_PORT.print("\t");
		SERIAL_PORT.print(ypr[1] * 180/M_PI);
		SERIAL_PORT.print("\t");
		SERIAL_PORT.println(ypr[2] * 180/M_PI);*/


		// blink LED to indicate activity
		//blinkState = !blinkState;
	}

}
