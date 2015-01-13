//Uncomment this is the node is connected to the glove controller, will will send additional data to
//#define HASGLOVE
//Uncomment this to enable Serial port to print out debug info
//#define DEBUG
//The address of this node
#define THIS_NODE 1

#ifdef HASGLOVE
//The virtual node number for the attached glove, it will be processed indivitually in the Android plugin
#define GLOVE_NODE 99
//Flex sensor pin
#define FLEX_PIN A6
//GPIO attached to finger contacts
#define INDEX_FINGER A7
#define MIDDLE_FINGER A0
#define RING_FINGER A1
#define SMALL_FINGER A2
//the range of analogRead from the flex sensor pin
//change it to fit the actual value
#define FLEX_MAX_AD 750
#define FLEX_MIN_AD 300

#endif