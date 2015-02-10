#include "Config.h"
#include "Wire.h"
#include <WiiChuck.h>
#include "JoyAxis.h"
#include "WiiManager.h"
#include "QuaternionCompact.h"
#include <RF24Network.h>
#include <RF24.h>
#include <SPI.h>
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

WiiManager wiiManager;
// Structure of our payload
struct payload_t
{
	uint16_t node_addr;
	QuaternionCompact dmp_quaternion;
};



//a fake Quaternion that use to contain wii chuck data
QuaternionCompact wiiQ;
//a fake Quaternion that use to contain wii chuck data history
QuaternionCompact wiiQ_his;

//Left redundant frames counter
unsigned char redundancy = 0;
void setup() {
	Serial.begin(115200);
	delay(20);
	/**RF24 setup*/
	SPI.begin();
	radio.begin();
	network.begin(/*channel*/ 90, /*node address*/ this_node);
	/**wii chuck setup*/
	wiiManager.setup();
#ifdef DEBUG
	Serial.println("Setup done");
#endif

}

void loop() {
	// Pump the network regularly
	network.update();
	unsigned long now = millis();
	if ( now - last_sent >= interval  )
	{
		last_sent = now;

		wiiQ = QuaternionCompact();
		wiiQ.x =wiiManager.getTheByte();
		if((!wiiQ_his.isEqualTo(wiiQ))||redundancy>0){
#ifdef DEBUG
			Serial.println(wiiQ.x);
#endif		
			if((!wiiQ_his.isEqualTo(wiiQ))){
				redundancy = MAX_REDUNANCY;
			}
			redundancy--;
			wiiQ_his = wiiQ;
			payload_t payload = { JOY_NODE_ID, wiiQ };
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



}