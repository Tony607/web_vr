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
				constructQuaternionByBytes(quaternion_raw_data);
		} else {
			//FIFO
			serialPacketBuffer.shift();
			serialPacketBuffer[3] = buf[i];
		}
	}
};
/**function that take a x,y,z,w bytes array from Arduino and construct the quaternion*/
var constructQuaternionByBytes = function(bytes_array){
	var q = [0,0,0,1];
	for(var i = 0; i < 4; i++){
		q[i] = (bytes_array[i] & 0xFF) / 127 - 1;
	}
	console.log("Quaternion:",q);
}