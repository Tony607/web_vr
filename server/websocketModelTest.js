////
//Test case for to phone quaternion and body tracker quaternion to generate the serial buffer
////
//configure data for three servos,(Yaw, Pitch, Roll)
//middle(0 degree), max(90 degree), min(angle limited by gimbal physical layout> -90 degree), need reverse

var servosMap = [
	[0x59, 0x9d, 0x20, true],
	[0x41, 0x86, 0x31, true],
	[0x5c, 0x9e, 0x1e, false]
];

var OrientationProcessor = require("./OrientationProcessor.js");
var THREE = require("three");
var controls = new OrientationProcessor(servosMap);
var q_BodyWorld = new THREE.Quaternion();
var clientQuaternions;
var WebSocketServer = require('ws').Server, wss = new WebSocketServer({
		port : 8089
	});
wss.on('connection', function (ws) {
	ws.on('message', function (message) {
		try {
			clientQuaternions = getQuaternionsFromBuffer(message);
		} catch (e) {
			console.log(e);
		}
		if (clientQuaternions.length === 2) {
			//set the two quaternion to the OrientationProcessor module
			//console.log("bodyQ:", clientQuaternions[1].x.toFixed(2), clientQuaternions[1].y.toFixed(2), clientQuaternions[1].z.toFixed(2), clientQuaternions[1].w.toFixed(2));
			var q = clientQuaternions[1];
			q_BodyWorld.set(q.x, q.y, q.z, q.w);
			var euler = new THREE.Euler( 0, 0, 0, 'XYZ' );
			euler.setFromQuaternion(q);
			logEuler(euler);
				// controls.setCameraWorldQuaternion(clientQuaternions[0]);
				// controls.setBodyWorldQuaternion(clientQuaternions[1]);
				// var q = {x:0,y:0,z:0,w:1};
				// var serial_buf = controls.setRobotWorldQuaternion(q);
			} else {
				console.log("Unknown format from Websocket. Expect two quaternions");
			}
		});
		ws.send('something');
	});
	/**
	function to parse the quaternions array from websocket bytes array buffer coming from
	Android, each quaternion take 4 bytes, x,y,z,w
	-1~1 is mapped between 0x00~0xFE in bytes,
	e.g. If the buffer length is 8, then the first 4 bytes correspond to the head(camear world)
	Quaternion, the next 4 bytes correspond to the first body node(the body world) Quaternion

	parameter: Buffer with length is a multiple of 4
	 */
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
	var logEuler = function(eul){
		var radtoDeg = 180 / Math.PI;
		x = (eul.x*radtoDeg).toFixed(2);//yaw
		y = (eul.y*radtoDeg).toFixed(2);//pitch
		z = (eul.z*radtoDeg).toFixed(2);//roll
		console.log("eu:",x,y,z);
	};