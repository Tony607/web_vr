var servosMap = [
	[0x20, 0xa5],
	[0x20, 0xa5],
	[0x20, 0xa5]
];

var OrientationProcessor = require("./OrientationProcessor.js");
var controls = new OrientationProcessor(servosMap);

var serialport = require("serialport");
var SerialPort = serialport.SerialPort; // localize object constructor
var serialPacketBuffer = [0, 0, 0, 0]; //length of 4
var quaternion_raw_data = [0, 0, 0, 0]; //this is the parsed data array

var arduinoPort = new SerialPort("/dev/rfcomm1", {
		baudrate : 115200,
		parser : serialport.parsers.raw
	});

arduinoPort.on('data', function (data) {
	//console.log(data);
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
			constructQuaternionByBytes(quaternion_raw_data);
		} else {
			//FIFO
			serialPacketBuffer.shift();
			serialPacketBuffer[3] = buf[i];
		}
	}
};
/**function that take a x,y,z,w bytes array from Arduino and construct the quaternion object*/
var constructQuaternionByBytes = function (bytes_array) {
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
	controls.setRobotWorldQuaternion(q);
	console.log("Quaternion:", q);
};
