/**
Config file
*/

#ifndef Config_h
#define Config_h
//Serial port to use
#define SERIAL_PORT Serial1
#define MPU_INT_PIN 2
//Uncomment this to enbale printing debug information to serial port
#define DEBUG_LOG
//legacy Debug selection
#define DEBUG_LEGACY 0
//Baud rate of the serial port
#define BAUD_RATE 115200
#define LED_PIN 13
#define DEBUG_PIN 12
#define DEBUG_PIN2 14

// uncomment "OUTPUT_READABLE_QUATERNION" if you want to see the actual
// quaternion components in a [w, x, y, z] format (not best for parsing
// on a remote host such as Processing or something though)
//#define OUTPUT_READABLE_QUATERNION

// uncomment "OUTPUT_READABLE_EULER" if you want to see Euler angles
// (in degrees) calculated from the quaternions coming from the FIFO.
// Note that Euler angles suffer from gimbal lock (for more info, see
// http://en.wikipedia.org/wiki/Gimbal_lock)
//#define OUTPUT_READABLE_EULER

// uncomment "OUTPUT_READABLE_YAWPITCHROLL" if you want to see the yaw/
// pitch/roll angles (in degrees) calculated from the quaternions coming
// from the FIFO. Note this also requires gravity vector calculations.
// Also note that yaw/pitch/roll angles suffer from gimbal lock (for
// more info, see: http://en.wikipedia.org/wiki/Gimbal_lock)
//#define OUTPUT_READABLE_YAWPITCHROLL

// uncomment "OUTPUT_READABLE_REALACCEL" if you want to see acceleration
// components with gravity removed. This acceleration reference frame is
// not compensated for orientation, so +X is always +X according to the
// sensor, just without the effects of gravity. If you want acceleration
// compensated for orientation, us OUTPUT_READABLE_WORLDACCEL instead.
//#define OUTPUT_READABLE_REALACCEL

// uncomment "OUTPUT_READABLE_WORLDACCEL" if you want to see acceleration
// components with gravity removed and adjusted for the world frame of
// reference (yaw is relative to initial orientation, since no magnetometer
// is present in this case). Could be quite handy in some cases.
//#define OUTPUT_READABLE_WORLDACCEL

// uncomment "OUTPUT_TEAPOT" if you want output that matches the
// format used for the InvenSense teapot demo
#define OUTPUT_READABLE_YAWPITCHROLL//OUTPUT_TEAPOT

/**define stepper motors pins*/

//Stepper motor 1 step pin
#define M1_STEP 6
//Stepper motor 1 direction pin
#define M1_DIR 7
//Stepper motor 2 step pin
#define M2_STEP 8
//Stepper motor 2 direction pin
#define M2_DIR 9
//Stepper motors enable pin
#define M_EN 10

#define ZERO_SPEED 65535
#define MAX_ACCEL 7

#define MAX_THROTTLE 530
#define MAX_STEERING 136
#define MAX_TARGET_ANGLE 12

// PRO MODE = MORE AGGRESSIVE
#define MAX_THROTTLE_PRO 650
#define MAX_STEERING_PRO 240 
#define MAX_TARGET_ANGLE_PRO 18

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

//Servo related

#define INITIAL_STATE 0
#define READ_SERVO0 1
#define READ_SERVO1 2
#define READ_SERVO2 3

#define START_BYTE 0XFF
#define DEBUG_SERVO
#endif