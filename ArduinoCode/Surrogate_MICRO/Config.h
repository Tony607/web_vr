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
#define M1_STEP 4
//Stepper motor 1 direction pin
#define M1_DIR 7
//Stepper motor 2 step pin
#define M2_STEP 8
//Stepper motor 2 direction pin
#define M2_DIR 9
//Stepper motors enable pin
#define M_EN 14


//Debug pin
#define DEBUG 16
#endif