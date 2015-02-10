//Uncomment this is the node is connected to the glove controller, will will send additional data to
#define HASGLOVE
//Uncomment this to enable Serial port to print out debug info
//#define DEBUG
//The address of this node
#define THIS_NODE 2

#ifdef HASGLOVE
//the old bread board has external pullup resistor for A6, A7, both 22 KOhm
//#define OLD_BREAD_BOARD
//MOTION NODE 01152015 PCB Baseboard
#define MOTION_NODE_V1
#ifdef OLD_BREAD_BOARD

//Flex sensor pin
#define FLEX_PIN A6
//GPIO attached to finger contacts
#define INDEX_FINGER A7
#define MIDDLE_FINGER A0
#define RING_FINGER A1
#define SMALL_FINGER A2
//the range of analogRead from the flex sensor pin
//change it to fit the actual value

#define FLEX_MAX_AD 820//800 for 20k internal pullup
#define FLEX_MIN_AD 520//420 for 20k internal pullup
#else

#ifdef MOTION_NODE_V1

//Flex sensor pin
#define FLEX_PIN A6
//GPIO attached to finger contacts
#define INDEX_FINGER A7
#define MIDDLE_FINGER A0
#define RING_FINGER A1
#define SMALL_FINGER A2
//the range of analogRead from the flex sensor pin
//change it to fit the actual value

#define FLEX_MAX_AD 820//800 for 20k internal pullup
#define FLEX_MIN_AD 520//420 for 20k internal pullup
//The AD pin is connect to a GPIO pin with pullup res enabled
#define FLEX_PULLUP_GPIO 1 //D1(TX)<-->A6
#define INDEX_PULLUP_GPIO 0 //D0(RX)<-->A7
#endif

#endif
//The virtual node number for the attached glove, it will be processed indivitually in the Android plugin
#define GLOVE_NODE 99
//Define the max value send to the game, the min value is 0
#define FLEX_MAX_VALUE 16
#endif