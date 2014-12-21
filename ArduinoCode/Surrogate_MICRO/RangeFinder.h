#ifndef _RANGEFINDER_H_
#define _RANGEFINDER_H_
//The pulseWidth measured by the range sensor
volatile unsigned int pulseWidth = 2013;
//This is the calcuated the horizontal distance in cm
volatile int horizontalDistance = 0;
/**the trigger pin level*/
bool trigEdge = false;

#endif