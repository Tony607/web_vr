/**define constant related to the servos*/
//the 90 degree servo unit
var OrientationProcessor = require("./OrientationProcessor.js");
var THREE = require("three");
var controls = new OrientationProcessor();

var clientdeviceorientation = {
	alpha: 0,
	beta: 0,
	gamma:0
};
function crateSerialPortData(array) {
	var buf = new Buffer(4);
	buf[0] = 0xFF;
	for (var i = 1; i < buf.length; i++) {
		buf[i] = array[i-1];
	};
	return buf;
}
/**
in arduino yun the default serial port to 32u4 is named ttyATH0
in Cubie Board 2 + arduino Pro Micro with usb connection,
the serial port is named ttyACM0

TODO: if needs support other ATmega328 based boards, the usb-serial connection 
will be named ttyUSB0
*/
var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({port: 8089});
wss.on('connection', function(ws) {
    ws.on('message', function(message) {
		try{
			clientdeviceorientation = JSON.parse(message);
		}catch(e){
			console.log(e);
		}
		//is browser device orientation object
		if(clientdeviceorientation.hasOwnProperty("alpha")){
			controls.deviceOrientation = clientdeviceorientation;
			controls.update();
		} else //is quaternion from Android application
		if(clientdeviceorientation.hasOwnProperty("x")){
			var servoArray = controls.getYawPitchRollFromDeviceQuaternion(clientdeviceorientation);
		} else {
			console.log("Unknown orientation format.");
		}
		//var servoArray = controls.getYawPitchRoll();		
    	//var writeBuffer = crateSerialPortData(servoArray)
		//console.log(writeBuffer);
    });
    ws.send('something');
});
