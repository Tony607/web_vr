
/**
Funtion that read the GPIO/Analog pin value connected to the glove and send the
result to the master node as a virtual node, the virtual node address is defined
in the Config.h file as GLOVE_NODE
*/
#ifdef HASGLOVE
//Define the anti shake time in ms
#define ANTI_SHAKE_TIME 50
void glovePinSetUp(){
	//set pullup on analog pins
#ifdef OLD_BREAD_BOARD
	digitalWrite(FLEX_PIN, HIGH);
	digitalWrite(INDEX_FINGER, HIGH);
	digitalWrite(MIDDLE_FINGER, HIGH);
	digitalWrite(RING_FINGER, HIGH);
	digitalWrite(SMALL_FINGER, HIGH);
#else
#ifdef MOTION_NODE_V1
	pinMode(FLEX_PULLUP_GPIO, INPUT_PULLUP);
	pinMode(INDEX_PULLUP_GPIO, INPUT_PULLUP);
	digitalWrite(FLEX_PULLUP_GPIO, HIGH);
	digitalWrite(INDEX_PULLUP_GPIO, HIGH);
	digitalWrite(MIDDLE_FINGER, HIGH);
	digitalWrite(RING_FINGER, HIGH);
	digitalWrite(SMALL_FINGER, HIGH);
#endif
#endif
}

void gloveNodeSend(){
	unsigned char arrGlove[4] = { 0x00, 0x00, 0x00, 0x00};
	unsigned char fingerContactsSumRead = 0x00;
	int flexPinValue = analogRead(FLEX_PIN);
	//TODO: map the value into a byte(0~255)
	//Need to get the actual value range
	flexPinValue = constrain(flexPinValue, FLEX_MIN_AD, FLEX_MAX_AD);
	//first byte contain the flex sensor data
	//we are not using 255 because the Master will send the data directly through
	//the serial port, and the 0xFF is reserved for the end sign for a node frame
	arrGlove[0]= hysteresisFilter(flexPinValue);

	if(analogRead(INDEX_FINGER)<=100){
		SET(fingerContactsSumRead,0);
	}
	if(digitalRead(MIDDLE_FINGER)==LOW){
		SET(fingerContactsSumRead,1);
	}
	if(digitalRead(RING_FINGER)==LOW){
		SET(fingerContactsSumRead,2);
	}
	if(digitalRead(SMALL_FINGER)==LOW){
		SET(fingerContactsSumRead,3);
	}
	arrGlove[1] = antiShakeButton(fingerContactsSumRead);
	memcpy(&handQ, arrGlove,  4 );

	if(!handQ_his.isEqualTo(handQ)){
		handQ_his = handQ;
#ifdef DEBUG
		Serial.print("Sending Glove");
#endif
		payload_t payload = { GLOVE_NODE, handQ };
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
/**Function used to filter the noisy flex sensor data, 
to reduce the overall sending frequency while still responsive*/
int hysteresisFilter(int readinValue){
	static int flexPinValue_his = 0;//preserving the data between function calls
	float flexPinValue_current =  mapfloat(readinValue, FLEX_MIN_AD, FLEX_MAX_AD, 0, 16);
	if(abs((float)flexPinValue_his-flexPinValue_current)>0.5){
		//round
		flexPinValue_his = (int)(flexPinValue_current+0.5);
	}
	return flexPinValue_his;

}

/**Function to deal with the finger contact antishake*/
unsigned char antiShakeButton(unsigned char fingerContactsSum){
	//antishake counter
	static unsigned long lastChangeTimeMs = millis();
	static unsigned char fingerContactsSum_his;
	if(fingerContactsSum !=fingerContactsSum_his){
		if(millis()-lastChangeTimeMs>ANTI_SHAKE_TIME || millis()<lastChangeTimeMs){
			lastChangeTimeMs =  millis();
			fingerContactsSum_his = fingerContactsSum;
		}
	}
	return fingerContactsSum_his;
}

float mapfloat(int x, int in_min, int in_max, int out_min, int out_max)
{
	return (float)(x - in_min) * (out_max - out_min) / (float)(in_max - in_min) + out_min;
}



#endif