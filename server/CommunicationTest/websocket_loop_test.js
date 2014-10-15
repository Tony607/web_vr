var WebSocketServer = require('ws').Server, wss = new WebSocketServer({
		port : 8089
	});
wss.on('connection', function (ws) {
	console.log("ws connected");
	ws.on('message', function (message) {
		try {
			console.log("message", message);
			ws.send(message);
		} catch (e) {
			console.log(e);
		}
	});
});
