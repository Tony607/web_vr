var servosMap = [
	[0x20, 0xa5],
	[0x20, 0xa5],
	[0x20, 0xa5]
];

var OrientationProcessor = require("./OrientationProcessor.js");
var THREE = require("three");
var controls = new OrientationProcessor(servosMap);
var q_RobotWorld = new THREE.Quaternion();

q_RobotWorld.setFromAxisAngle( new THREE.Vector3( 0, 0, 1 ), Math.PI / 4 );
controls.setRobotWorldQuaternion(q_RobotWorld);
var servoarray = controls.getServoArray();

console.log("Servo Array:", servoarray);