/**define constant related to the servos*/
//the 90 degree servo unit
var OrientationProcessor = require("./OrientationProcessor.js");
var THREE = require("three");


var clientdeviceorientation = {
	alpha: 0,
	beta: 0,
	gamma:0
};
function crateSerialPortData(orientation) {
	var str = orientation.alpha.toFixed(1) +":"+
	orientation.beta.toFixed(1) +":"+  
	orientation.gamma.toFixed(1)+"#";
	//console.log(str);
	return str;
}
var arduinoPort;
/**
in arduino yun the default serial port to 32u4 is named ttyATH0
in Cubie Board 2 + arduino Pro Micro with usb connection,
the serial port is named ttyACM0

TODO: if needs support other ATmega328 based boards, the usb-serial connection 
will be named ttyUSB0
*/
var serialportName = require("os").hostname()==="Arduino"?"ttyATH0":"ttyACM0";
var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({port: 8080});
wss.on('connection', function(ws) {
    ws.on('message', function(message) {
        clientdeviceorientation = JSON.parse(message);
        controls.deviceOrientation = clientdeviceorientation;
		controls.update();
		//controls.object.quaternion;
		console.log(controls.getYawPitchRoll());

    	if(arduinoPort && !arduinoPort.paused){
    		//console.log("writing to serialport...");
    		arduinoPort.write(crateSerialPortData(clientdeviceorientation));
    	}
    });
    ws.send('something');
});

console.log("---Try to connect to serial port /dev/"+serialportName+"---");
var serialport = require("serialport");
var SerialPort = serialport.SerialPort; // localize object constructor
arduinoPort = new SerialPort("/dev/"+serialportName, {
		baudrate : 115200,
		parser : serialport.parsers.readline("#")
	});
arduinoPort.on("open", function () {
	console.log('arduinoPort->open');
	//console.log(JSON.stringify(arduinoPort, null, 4));
	/*arduinoPort.write("ls\n", function (err, results) {
		console.log('err ' + err);
		console.log('results ' + results);
	});*/
});

arduinoPort.on('data', function (data) {
	console.log("arduinoPort->data:",data.toString());
});
arduinoPort.on('close', function () {
	console.log('arduinoPort->close');
});
arduinoPort.on('error', function () {
	console.log('arduinoPort->error');
});