// B-ROBOT  SELF BALANCE ROBOT WITH STEPPER MOTORS
// Arduino Micro
// MPU6050 using DMP processor

// Angle calculations and control part is running at 200Hz from DMP solution
// DMP is using the gyro_bias_no_motion correction method.
// The board needs at least 10-15 seconds to give good values...

#include "Config.h"
#include <Wire.h>
#include <I2Cdev.h>
#include <JJ_MPU6050_DMP_6Axis_50Hz.h>  // Modified version of the library to work with DMP (see comments inside)
#include <RF24Network.h>
#include <RF24.h>
#include <SPI.h>
#include "QuaternionCompact.h"

// nRF24L01(+) radio attached using Getting Started board 
RF24 radio(9,10);

// Network uses that radio
RF24Network network(radio);

// Address of our node
const uint16_t this_node = 0;

// Address of the other node
const uint16_t other_node = 1;

// How often to send 'hello world to the other unit
const unsigned long interval = 50; //ms

// When did we last send?
unsigned long last_sent;
// Structure of our payload
struct payload_t
{
  uint16_t node_addr;
  QuaternionCompact dmp_quaternion;
};

#define DEBUG 0

#define CLR(x,y) (x&=(~(1<<y)))
#define SET(x,y) (x|=(1<<y))

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

// MPU control/status vars
bool dmpReady = false;  // set true if DMP init was successful
uint8_t mpuIntStatus;   // holds actual interrupt status byte from MPU
uint8_t devStatus;      // return status after each device operation (0 = success, !0 = error)
uint16_t packetSize;    // expected DMP packet size (for us 18 bytes)
uint16_t fifoCount;     // count of all bytes currently in FIFO
uint8_t fifoBuffer[18]; // FIFO storage buffer
Quaternion q;
//Record the last compact quaternion representation
QuaternionCompact q_compact_his;

float dt;

// class default I2C address is 0x68
MPU6050 mpu;

// Set up nRF24L01 radio on SPI bus plus pins 9 & 10 


void setup() 
{ 
	Serial.begin(115200);
	/**MPU6050 setup*/
	// Join I2C bus
	Wire.begin();
	// 4000Khz fast mode
	TWSR = 0;
	TWBR = ((F_CPU/I2C_SPEED)-16)/2;
	TWCR = 1<<TWEN;

	Serial.println("Initializing I2C devices...");
	//mpu.initialize();
	mpu.setClockSource(MPU6050_CLOCK_PLL_ZGYRO);
	mpu.setFullScaleGyroRange(MPU6050_GYRO_FS_2000);
	mpu.setFullScaleAccelRange(MPU6050_ACCEL_FS_2);
	mpu.setDLPFMode(MPU6050_DLPF_BW_20);  //10,20,42,98,188
	mpu.setRate(4);   // 0=1khz 1=500hz, 2=333hz, 3=250hz 4=200hz
	mpu.setSleepEnabled(false);

	delay(2000);
	Serial.println(F("Initializing DMP..."));
	devStatus = mpu.dmpInitialize();
	if (devStatus == 0) {
		// turn on the DMP, now that it's ready
		Serial.println(F("Enabling DMP..."));
		mpu.setDMPEnabled(true);
		mpuIntStatus = mpu.getIntStatus();
		dmpReady = true;

	} else { // ERROR!
		// 1 = initial memory load failed
		// 2 = DMP configuration updates failed
		// (if it's going to break, usually the code will be 1)
		Serial.print(F("DMP Initialization failed (code "));
		Serial.print(devStatus);
		Serial.println(F(")"));
	}

	// Gyro calibration
	// The robot must be steady during initialization
	delay(15000);   // Time to settle things... the bias_from_no_motion algorithm needs some time to take effect and reset gyro bias.

	// verify connection
	Serial.println("Testing device connections...");
	Serial.println(mpu.testConnection() ? "MPU6050 connection successful" : "MPU6050 connection failed");
	delay(2000);
	//Adjust sensor fusion gain
	Serial.println("Adjusting DMP sensor fusion gain...");
	dmpSetSensorFusionAccelGain(0x20);
	delay(1000);
	mpu.resetFIFO();
	/**RF24 setup*/
	Serial.println("RF24Network/examples/helloworld_rx/");
	SPI.begin();
	radio.begin();
	network.begin(/*channel*/ 90, /*node address*/ this_node);
}


// Main loop
void loop() 
{
	
	// Pump the network regularly
	network.update();
	// Is there anything ready for us?
	while ( network.available() )
	{
		// If so, grab it and print it out
		RF24NetworkHeader header;
		payload_t payload;
		network.read(header,&payload,sizeof(payload));
		//Serial.print("Received packet>");
		//Serial.print(payload.node_addr);
		//if the node is a IMU node
		if(payload.node_addr<MAX_IMU_NODE){
			printAnyQuaternion(payload.dmp_quaternion, payload.node_addr);
		} else {//other wise it is a special node, ie. glove node, where the quaternion is just a container for special data
			printGloveNode(payload.dmp_quaternion, payload.node_addr);
		}
		
	}
	unsigned long now = millis();
	if ( now - last_sent >= interval  )
	{
		last_sent = now;
		printQuaternion();
	}

	// New DMP Orientation solution?
	fifoCount = mpu.getFIFOCount();
	if (fifoCount>=18)
	{
		if (fifoCount>18)  // If we have more than one packet we take the easy path: discard the buffer 
		{
			//Serial.println("FIFO RESET!!");
			mpu.resetFIFO();
			return;
		}
		dmpReadQuaternionToq();
		mpu.resetFIFO();  // We always reset FIFO
	}
}
