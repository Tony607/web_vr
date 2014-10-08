var serialport = require("serialport");
var SerialPort = serialport.SerialPort; // localize object constructor
var serialPacketBuffer = [0,0,0,0]; //length of 4
var quaternion_raw_data = [0,0,0,0]; //this is the parsed data array

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
				console.log("Quaternion:",quaternion_raw_data);
		} else {
			//FIFO
			serialPacketBuffer.shift();
			serialPacketBuffer[3] = buf[i];
		}
	}
};
