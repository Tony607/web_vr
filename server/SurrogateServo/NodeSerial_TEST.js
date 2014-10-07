var serialport = require("serialport");
var SerialPort = serialport.SerialPort; // localize object constructor

var arduinoPort = new SerialPort("/dev/rfcomm0", {
		baudrate : 115200,
		parser : serialport.parsers.raw
	});

arduinoPort.on('data', function (data) {
	console.log(data);
});
arduinoPort.on('close', function () {
	console.log('arduinoPort->close');
});
arduinoPort.on('error', function () {
	console.log('arduinoPort->error');
});
