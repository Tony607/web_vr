var THREE = require("three");
var OrientationProcessor = require("./OrientationProcessor.js")
var camera = new THREE.PerspectiveCamera( 75, 1920 / 1080, 1, 1000 );

var controls = new OrientationProcessor(camera);

//initial
controls.deviceOrientation = {alpha: 30, beta: 10, gamma: 10};
controls.update();
var eu = (new THREE.Euler()).setFromQuaternion(controls.object.quaternion);
console.log(controls.getYawPitchRoll());
/*console.log("x=",THREE.Math.radToDeg(eu.x))
console.log("y=",THREE.Math.radToDeg(eu.y))
console.log("z=",THREE.Math.radToDeg(eu.z))*/
/**

//

//initial
controls.deviceOrientation = {alpha: 43.06647261669845, beta: -1.8509070242249999, gamma: -87.30062171830068};
controls.update();
controls.object.quaternion
var eu = (new THREE.Euler()).setFromQuaternion(controls.object.quaternion);
console.log("x=",THREE.Math.radToDeg(eu.x))
console.log("y=",THREE.Math.radToDeg(eu.y))
console.log("z=",THREE.Math.radToDeg(eu.z))
//

//current1
controls.deviceOrientation = {alpha: 219.27788188757236, beta: -148.12295057591487, gamma: 61.30556711004572};
controls.update();
controls.object.quaternion
var eu = (new THREE.Euler()).setFromQuaternion(controls.object.quaternion);
console.log("x=",THREE.Math.radToDeg(eu.x))
console.log("y=",THREE.Math.radToDeg(eu.y))
console.log("z=",THREE.Math.radToDeg(eu.z))
*/