/**
This module set up the express web server and socket.io server to set up a web ui for debugging purpose
set the port number, default port number is 8087
*/
function DebugServer(portnumber) {
	var io = require('socket.io');
	/**
	Call this function to send any data through the socket.io
	*/
	this.sendMessage = function(msg){
		io.sockets.emit('message', msg);
	};
	var initDebugServer = function (port_number) {
		var http = require('http');

		var express = require('express'),
		app = express();
		var server = http.createServer(app);
		io = io.listen(server); //this return the new object we want to listen to
		server.listen(port_number !== undefined ? port_number : 8087);

		app.set('views', __dirname + '/www/');
		//serving files in ./js
		app.use(express.static(__dirname + '/www/'));

		app.get('/www/', function (req, res) {
			var homePage = process.argv[2] ? process.argv[2] : 'index.html';
			console.log("send file: " + homePage);
			res.sendfile(homePage);
		});

		io.sockets.on('connection', function (socket) {
			socket.on('message', function (msg) {});
			// If a web browser disconnects from Socket.IO then this callback is called.
			socket.on('disconnect', function () {
				console.log('disconnected');
			});
		});

	};
	initDebugServer(portnumber);
};

module.exports = DebugServer;
