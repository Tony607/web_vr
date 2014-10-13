var clientQuaternions;
var WebSocketServer = require('ws').Server, wss = new WebSocketServer({
		port : 8089
	});
wss.on('connection', function (ws) {
	ws.on('message', function (message) {
		try {
			console.log("message", message);
			getQuaternionsFromBuffer(message);
		} catch (e) {
			console.log(e);
		}
	});
	ws.send('something');
});

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
