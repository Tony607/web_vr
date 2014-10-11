////
//Test case for to phone quaternion and body tracker quaternion to generate the serial buffer
////
/**define servo map values
Yaw, Pitch, Roll servo
Note: If there is a need to reverse the turning direction of a servo, just switch the two numbers for the servo
*/
var servosMap = [
	[0x20, 0xa5],
	[0x20, 0xa5],
	[0x20, 0xa5]
];

var OrientationProcessor = require("./OrientationProcessor.js");
var THREE = require("three");
var controls = new OrientationProcessor(servosMap);

var clientQuaternions;
/**
in arduino yun the default serial port to 32u4 is named ttyATH0
in Cubie Board 2 + arduino Pro Micro with usb connection,
the serial port is named ttyACM0

TODO: if needs support other ATmega328 based boards, the usb-serial connection
will be named ttyUSB0
 */
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
			var q = {x:0,y:0,z:0,w:1};
			var serial_buf = controls.setRobotWorldQuaternion(q);
		} else {
			console.log("Unknown orientation format.");
		}
	});
	ws.send('something');
});
