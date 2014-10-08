var servosMap = [
	[0x20, 0xa5],
	[0x20, 0xa5],
	[0x20, 0xa5]
];

var OrientationProcessor = require("./OrientationProcessor.js");
var THREE = require("three");
var controls = new OrientationProcessor(servosMap);
var q_RobotWorld = new THREE.Quaternion();
var rotateZ = Math.PI / 4;
console.log("set q_RobotWorld rotating around z axis ",rotateZ.toFixed(3), " in rad.");
q_RobotWorld.setFromAxisAngle( new THREE.Vector3( 0, 0, 1 ), rotateZ );
controls.setRobotWorldQuaternion(q_RobotWorld);