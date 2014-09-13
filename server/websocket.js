var clientdeviceorientation = {
	alpha: 0,
	beta: 0,
	gamma:0,
};
var arduinoPort;
var serialportName = os.hostname()==="Arduino"?"ttyATH0":"ttyUSB0";
var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({port: 8080});
wss.on('connection', function(ws) {
    ws.on('message', function(message) {
        console.log(JSON.stringify(message, null, 4));
    	if(arduinoPort && !arduinoPort.paused){
    		console.log("writing to serialport...");
    		arduinoPort.write("deviceOrientation");
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