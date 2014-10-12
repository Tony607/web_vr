//configure data for three servos,(Yaw, Pitch, Roll)
//middle(0 degree), max(90 degree), min(angle limited by gimbal physical layout> -90 degree), need reverse
var servosMap = [
	[0x59, 0x9d, 0x20, true],
	[0x41, 0x86, 0x31, true],
	[0x60, 0xa3, 0x20, false]
];
var serialportName = "/dev/rfcomm1";
var serialPacketBuffer = [0, 0, 0, 0]; //length of 4
var quaternion_raw_data = [0, 0, 0, 0]; //this is the parsed data array
var OrientationProcessor = require("./OrientationProcessor.js");
var THREE = require("three");
var controls = new OrientationProcessor(servosMap);
var serialport = require("serialport");
var SerialPort = serialport.SerialPort; // localize object constructor
/**
Two aligned quaternion coming from the user,
first  quaternion:
Aligned and adjusted Quaternion of the head mount display, in this case the Google Cardboard
second quaternion:
Aligned and adjusted Quaternion of the wearable body tracker, it is placed on upper human body
 */
var clientQuaternions;
function crateSerialPortData(array) {
	var buf = new Buffer(4);
	buf[0] = 0xFF;
	for (var i = 1; i < buf.length; i++) {
		buf[i] = array[i - 1];
	};
	return buf;
}
var arduinoPort;

var WebSocketServer = require('ws').Server, wss = new WebSocketServer({
		port : 8089
	});
wss.on('connection', function (ws) {
	ws.on('message', function (message) {
		try {
			clientQuaternions = JSON.parse(message);
		} catch (e) {
			console.log(e);
		}
		if (clientQuaternions.length === 2) {
			//set the two quaternion to the OrientationProcessor module
			controls.setCameraWorldQuaternion(clientQuaternions[0]);
			controls.setBodyWorldQuaternion(clientQuaternions[1]);
		} else {
			console.log("Unknown format from Websocket. Expect two quaternions");
		}
	});
	//TODO: might send something to notify the user that the robot is online and status
	ws.send('something');
});

console.log("---Try to connect to serial port " + serialportName + "---");
arduinoPort = new SerialPort(serialportName, {
				baudrate : 115200,
				parser: serialport.parsers.raw//parser : serialport.parsers.readline(" # ")
			});
		arduinoPort.on(" open ", function () {
			console.log('arduinoPort->open');
		});
		arduinoPort.on('data', function (data) {
			//console.log(" arduinoPort->data ",data);
			readQuaternionFromBuffer(data);
		});
		arduinoPort.on('close', function () {
			console.log('arduinoPort->close');
		});
		arduinoPort.on('error', function () {
			console.log('arduinoPort->error');
		});
		/**
		Function that read the incoming serial buffer and parse the quaternion data 
		 */
		var readQuaternionFromBuffer = function (buf) {
			for (var i = 0; i < buf.length; i++) {
				if (buf[i] === 0xFF) { //stop sign
					//copy array
					quaternion_raw_data = serialPacketBuffer.slice();
					handleSerialComm(quaternion_raw_data);
				} else {
					//FIFO
					serialPacketBuffer.shift();
					serialPacketBuffer[3] = buf[i];
				}
			}
		};
		/**function that take a x,y,z,w bytes array coming from Arduino serial port and construct the quaternion object,
			call the OrientationProcessor to calculate and generate the output serial buffer,
			finally send this buffer to serial port
		*/
		var handleSerialComm = function (bytes_array) {
			var q = {
				x : 0,
				y : 0,
				z : 0,
				w : 1
			};
			q.x = (bytes_array[0] & 0xFF) / 127 - 1;
			q.y = (bytes_array[1] & 0xFF) / 127 - 1;
			q.z = (bytes_array[2] & 0xFF) / 127 - 1;
			q.w = (bytes_array[3] & 0xFF) / 127 - 1;
			//test the OrientationProcessor
			var serial_buf = controls.setRobotWorldQuaternion(q);
			if(arduinoPort && !arduinoPort.paused){
				//console.log(" serial_buf ",serial_buf);
				arduinoPort.write(serial_buf);
			}
			console.log(" Quaternion : ", q);
		};
