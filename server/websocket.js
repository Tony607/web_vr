var clientdeviceorientation = {
	alpha: 0,
	beta: 0,
	gamma:0,
};
var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({port: 8080});
wss.on('connection', function(ws) {
    ws.on('message', function(message) {
        console.log(JSON.stringify(message, null, 4));
    	//ws.send('something');
    });
    ws.send('something');
});