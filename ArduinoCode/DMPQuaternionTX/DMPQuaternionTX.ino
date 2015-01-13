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

// Address of our node, change it to match with your node number
const uint16_t this_node = THIS_NODE;

// Address of the other node
const uint16_t other_node = 0;

// How often to send 'hello world to the other unit
const unsigned long interval = 50; //ms

// When did we last send?
unsigned long last_sent;

// How many have we sent already
unsigned long packets_sent;

// Structure of our payload
struct payload_t
{
	uint16_t node_addr;
	QuaternionCompact dmp_quaternion;
};

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
#ifdef HASGLOVE
//a fake Quaternion that use to contain Glove data
Quaternion handQ;
#endif

uint8_t loop_counter;       // To generate a medium loop 40Hz 
float dt;

// class default I2C address is 0x68
MPU6050 mpu;

// Set up nRF24L01 radio on SPI bus plus pins 9 & 10 


void setup() 
{ 
	Serial.begin(115200);
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
	Serial.println("RF24Network/examples/helloworld_tx/");
	SPI.begin();
	radio.begin();
	network.begin(/*channel*/ 90, /*node address*/ this_node);
#ifdef HASGLOVE	
	glovePinSetUp();
#endif
}


// Main loop
void loop() 
{
	// Pump the network regularly
	network.update();

	// If it's time to send a message, send it!
	unsigned long now = millis();
	if ( now - last_sent >= interval  )
	{
		last_sent = now;
#ifdef DEBUG
		Serial.print("Sending...");
#endif
		QuaternionCompact q_compact = QuaternionCompact(q);
		if(!q_compact_his.isEqualTo(q_compact)){
			q_compact_his = q_compact;
			payload_t payload = { this_node, q_compact };
			RF24NetworkHeader header(/*to node*/ other_node);
			bool ok = network.write(header,&payload,sizeof(payload));
#ifdef DEBUG
			if (ok)
				Serial.println("ok.");
			else
				Serial.println("failed.");
#endif
		}
	}
#ifdef HASGLOVE
	gloveNodeSend();
#endif
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
		loop_counter++;
		dmpReadQuaternionToq();
		mpu.resetFIFO();  // We always reset FIFO
		if (loop_counter >= 5)
		{
			loop_counter = 0;
			//printQuaternion();
		} // Medium loop
	}
}
/**
Funtion that read the GPIO/Analog pin value connected to the glove and send the
result to the master node as a virtual node, the virtual node address is defined
in the Config.h file as GLOVE_NODE
*/
#ifdef HASGLOVE

void glovePinSetUp(){
	//set pullup on analog pins
	digitalWrite(FLEX_PIN, HIGH);
	digitalWrite(INDEX_FINGER, HIGH);
	digitalWrite(MIDDLE_FINGER, HIGH);
	digitalWrite(RING_FINGER, HIGH);
	digitalWrite(SMALL_FINGER, HIGH);
}

void gloveNodeSend(){
	unsigned char arrX[4] = { 0x00, 0x00, 0x00, 0x00};

	int flexPinValue = analogRead(FLEX_PIN);
	//TODO: map the value into a byte(0~255)
	//Need to get the actual value range
	flexPinValue = constrain(flexPinValue, FLEX_MIN_AD, FLEX_MAX_AD);
	//first byte contain the flex sensor data
	//we are not using 255 because the Master will send the data directly through
	//the serial port, and the 0xFF is reserved for the end sign for a node frame
	arrX[0]= map(flexPinValue, FLEX_MIN_AD, FLEX_MAX_AD, 0, 254);
	if(digitalRead(INDEX_FINGER)==LOW){
		SET(arrX[1],0);
	}
	if(digitalRead(MIDDLE_FINGER)==LOW){
		SET(arrX[1],1);
	}
	if(digitalRead(RING_FINGER)==LOW){
		SET(arrX[1],2);
	}
	if(digitalRead(SMALL_FINGER)==LOW){
		SET(arrX[1],3);
	}

	//we only use the x in the Quaternion to contain 4 bytes of data
	memcpy(&handQ.x, arrX,  4 );
#ifdef DEBUG
	Serial.print("Sending Glove");
#endif
	payload_t payload = { GLOVE_NODE, handQ };
	RF24NetworkHeader header(/*to node*/ other_node);
	bool ok = network.write(header,&payload,sizeof(payload));
	if (ok)
#ifdef DEBUG
		Serial.println("ok.");
#endif
	else
#ifdef DEBUG
		Serial.println("failed.");
#endif
}
#endif