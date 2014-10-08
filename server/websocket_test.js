var clientQuaternions;
var WebSocketServer = require('ws').Server, wss = new WebSocketServer({
		port : 8080
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
			console.log("clientQuaternions",clientQuaternions);
		} else {
			console.log("Unknown format from Websocket. Expect two quaternions");
		}
	});
	//TODO: might send something to notify the user that the robot is online and status
	ws.send('something');
});
