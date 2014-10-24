#ifndef _CONFIG_H_
#define _CONFIG_H_

#define SERIAL_PORT Serial1
#define INITIAL_STATE 0
#define READ_SERVO0 1
#define READ_SERVO1 2
#define READ_SERVO2 3
#define READ_THROTTLE 4
#define READ_STEERING 5
#define START_BYTE 0XFF

//Stability PD
#define SAFEMAXKP 0.5
#define SAFEMAXKD 40.0

//stepper pins

//Stepper motor 1 step pin
#define M1_STEP 21
//Stepper motor 1 direction pin
#define M1_DIR 7
//Stepper motor 2 step pin
#define M2_STEP 8
//Stepper motor 2 direction pin
#define M2_DIR 9
//Stepper motors enable pin
#define M_EN 14

//the max tilt(pan) angle considered as upright
#define MAX_UPRIGHT_ANGLE 50
//The min tilt(pan) angle considered as raising up
#define RISING_UP 40
//The min tilt(pan) angle considered as straight up
#define STRAIGHT_UP 10
//Max motor speed
#define MAX_MOTOR_SPEED 500
//The max time the motors can run at max speed 
//before turning them of. Measured in times of slow_loop(set to 100ms) period
//it should be a uint_8 number(0~255)
#define Max_FreeWheel_Count 30
//ultrasound range finder trigger pin
#define TRIGGER_PIN 16
//ultrasound range finder echo pin, PD4, ICP1
#define ECHO_PIN 4
//Debug pin
#define DEBUG 16
//the distance in pulsewidth considered as entering the warning zone
//the Distance(cm) = pulseWidth Count X 3.65
#define WARNING_PW 255//about 70cm/

#define DEADBAND_FAR 110 //30cm

#define DEADBAND_NEAR 73//20cm
//The distance in pulsewidth considered as entering the danger zone
#define DANGER_PW 37// about 10cm


//The Range sensor is mounted to tilting up for 30 degree
#define SENSOR_MOUNT_TILT 30
#endif