//RF24 address of this node
#define DEBUG
#define THIS_NODE 3
#define JOY_NODE_ID 98
//Each Joy stick axis is 8 bits value from wii chuck
#define JOY_AXIS_MAX 255
//How many redundant frame we will send to make reduce the chance that the
//host lost a frame
#define MAX_REDUNANCY 2