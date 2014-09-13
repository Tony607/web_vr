var io = require('socket.io').listen(8080);
/*
app.get('/', function(req, res){
  res.sendfile('index.html');
});
*/
io.sockets.on('connection', function(socket){
    console.log('socket.io listening on *:8080');
    socket.on('tilt message', function(msg){
	console.log(msg);
	//io.emit('tilt message', msg);
    });
});

