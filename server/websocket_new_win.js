/**
This is the test code which accept both quaternion and distance data from the Arduino
and send the data to the client through WebSocket.
 */
//configure data for three servos,(Yaw, Pitch, Roll)
//middle(0 degree), max(90 degree), min(angle limited by gimbal physical layout> -90 degree), need reverse
var servosMap = [
	[0x5e, 0x99, 0x26, true],
	[0x62, 0xa3, 0x52, true],
	[0x5c, 0x9e, 0x1e, false]
];
var debug_mode = true;
if (debug_mode) {
	var DebugServer = require("./DebugServer.js");
	var debugServer = new DebugServer(8888);
}

var serialPacketLength = 6; //x,y,z,w,distance,0xFF
var buffLength = serialPacketLength * 2 - 1; //1 byte less than two pack size
var serialPacketBufferArray = [0, 0, 0, 0, 0]; //length of 6
var quaternion_raw_data = [0, 0, 0, 0]; //this is the parsed data array
var OrientationProcessor = require("./OrientationProcessor.js");
var THREE = require("three");
var controls = new OrientationProcessor(servosMap);
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
			clientQuaternions = getQuaternionsFromBuffer(message);
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
/**
function to parse the quaternions array from websocket bytes array buffer coming from
Android, each quaternion take 4 bytes, x,y,z,w
-1~1 is mapped between 0x00~0xFE in bytes,
e.g. If the buffer length is 8, then the first 4 bytes correspond to the head(camear world)
Quaternion, the next 4 bytes correspond to the first body node(the body world) Quaternion

parameter: Buffer with length is a multiple of 4
 */
var getQuaternionsFromBuffer = function (bytesBuffer) {
	quaternions = [];
	var tmp_buffer = new Buffer(4);
	var numberOfQuaternions = bytesBuffer.length / 4;
	for (var i = 0; i < numberOfQuaternions; i++) {
		//copy one quaternion's buffer section
		bytesBuffer.copy(tmp_buffer, 0, i * 4, i * 4 + 4);
		var q = {
			x : 0,
			y : 0,
			z : 0,
			w : 1
		};
		q.x = (tmp_buffer[0] & 0xFF) / 127 - 1;
		q.y = (tmp_buffer[1] & 0xFF) / 127 - 1;
		q.z = (tmp_buffer[2] & 0xFF) / 127 - 1;
		q.w = (tmp_buffer[3] & 0xFF) / 127 - 1;
		quaternions[i] = q;
	}
	return quaternions;
};

console.log("---NO serial support, run on window---");
setInterval(function () {
	var dummyBuff = new Buffer(6);
	readQuaternionFromBuffer(dummyBuff);
}, 20);
/**
Function that read the incoming serial buffer and parse the quaternion data
 */
var readQuaternionFromBuffer = function (buf) {
	var i = 0;
	//if the buffer is too long just use the last(latest) pack
	if (buf.length >= buffLength) {
		//read the buffer from the last byte, and find the first occurrence of 0xFF
		for (i = buf.length - 1; i >= 0; i--) {
			if (buf[i] === 0xFF) { //found the latest stop sign in index i of the big buffer
				//slice out the last package with length of 4(trimmed out the stop sign)
				//because we just need the 4 bytes to construct the quaternion and one for the distance(total 5 bytes)
				buf = buf.slice(i - serialPacketLength - 1, i);
				//shift the most latest incomplete pack to the serialPacketBufferArray
				//if any bytes exist after the stop sign
				for (var k = i + 1; k < buf.length - 1; k++) {
					serialPacketBufferArray.shift();
					serialPacketBufferArray[serialPacketLength - 2] = buf[k];
				}
				handleSerialComm(buf);
				return; //done with the big buffer
			}
		}
	}
	for (i = 0; i < buf.length; i++) {
		if (buf[i] === 0xFF) { //stop sign
			//copy array
			quaternion_raw_data = serialPacketBufferArray.slice();
			handleSerialComm(quaternion_raw_data);
		} else {
			//FIFO
			serialPacketBufferArray.shift();
			serialPacketBufferArray[serialPacketLength - 2] = buf[i];
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
	var robot_distance = bytes_array[4];
	//test the OrientationProcessor
	var serial_buf = controls.setRobotWorldQuaternion(q);
	if (debug_mode) {
		var robot_pitch = controls.calculateRobotPitchAngle();
		var cmd_throttle = serial_buf[3];
		var sendPack = {
			throttle : cmd_throttle,
			angle : robot_pitch,
			distance : robot_distance
		};
		debugServer.sendMessage(sendPack);
	}
	if (arduinoPort && !arduinoPort.paused) {
		//console.log(" serial_buf ",serial_buf);
		arduinoPort.write(serial_buf);
	}
	console.log(" Quaternion : ", q);
};

var runDummyLoop = function () {
	console.log("running dummy loop...");
	setInterval(function () {
		var dummyBuff = new Buffer(6);
		readQuaternionFromBuffer(dummyBuff);
	}, 20);

}
setTimeout(runDummyLoop, 3);