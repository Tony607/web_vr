var THREE = require("three");
/**
x is in the plane of the screen or keyboard and is positive towards the right hand side of the screen or keyboard.
y is in the plane of the screen or keyboard and is positive towards the top of the screen or keyboard.
z is perpendicular to the screen or keyboard, positive out of the screen or keyboard.
*/
//alpha: z (0~360)
//beta:x (-180 ~ +180)
//gamma:y (-90 ~ +90)
/**
Thus the angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''.
Note that this choice of angles follows mathematical convention, 
but means that alpha is in the opposite sense to a compass heading. 
It also means that the angles do not match the roll-pitch-yaw convention used in vehicle dynamics.
*/
//Initial read from user device: 
//the device is held in cardboard vr position(x axis pointing relatively to the sky)
var customerDeviceInitialOrientation = {alpha: 43.06647261669845, beta: -1.8509070242249999, gamma: -87.30062171830068};
//the user is looking up, turned left a little bit and row head to the left a little bit
var customerDeviceOrientation = {alpha: 219.27788188757236, beta: -148.12295057591487, gamma: 61.30556711004572};

var degtorad = Math.PI / 180; // Degree-to-Radian conversion
//raw Euler angle read from the user device
/**
var raw_eu = new THREE.Euler(customerDeviceInitialOrientation.beta,
							customerDeviceInitialOrientation.gamma,
							customerDeviceInitialOrientation.alpha,'XYZ');

var raw_quaternion  = new THREE.Quaternion();
raw_quaternion.setFromEuler(raw_eu);
console.log("quaternion calculated by three js",raw_quaternion);
*/
//custom functions
//Q.1: Converting deviceorientation angles to a Unit Quaternion representation
function getBaseQuaternion( alpha, beta, gamma ) {

  var _x = beta  ? beta  * degtorad : 0; // beta value
  var _y = gamma ? gamma * degtorad : 0; // gamma value
  var _z = alpha ? alpha * degtorad : 0; // alpha value

  var cX = Math.cos( _x/2 );
  var cY = Math.cos( _y/2 );
  var cZ = Math.cos( _z/2 );
  var sX = Math.sin( _x/2 );
  var sY = Math.sin( _y/2 );
  var sZ = Math.sin( _z/2 );

  //
  // ZXY quaternion construction.
  //

  var w = cX * cY * cZ - sX * sY * sZ;
  var x = sX * cY * cZ - cX * sY * sZ;
  var y = cX * sY * cZ + sX * cY * sZ;
  var z = cX * cY * sZ + sX * sY * cZ;

  return [ w, x, y, z ];

}
//Q.2: Fixing our quaternion frame relative to the current screen orientation
function getScreenTransformationQuaternion( screenOrientation ) {
	var orientationAngle = screenOrientation ? screenOrientation * degtorad : 0;

	var minusHalfAngle = - orientationAngle / 2;

	// Construct the screen transformation quaternion
	var q_s = [
		Math.cos( minusHalfAngle ),
		0,
		0,
		Math.sin( minusHalfAngle )
	];

	return q_s;
}
//Q.3: Fixing our quaternion frame relative to our application’s world orientation
//vr view, y axis 90 degrees up
function getWorldTransformationQuaternion() {
	var worldAngle = 90 * degtorad;

	var minusHalfAngle = - worldAngle / 2;

	// Construct the world transformation quaternion
	var q_w = [
		Math.cos( minusHalfAngle ),
		Math.sin( minusHalfAngle ),
		0,
		0
	];

	return q_w;
}

//Q.4: Computing our final quaternion representation
function quaternionMultiply( a, b ) {
	var w = a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3];
	var x = a[1] * b[0] + a[0] * b[1] + a[2] * b[3] - a[3] * b[2];
	var y = a[2] * b[0] + a[0] * b[2] + a[3] * b[1] - a[1] * b[3];
	var z = a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1];

	return [ w, x, y, z ];
}

function computeQuaternion(orientation) {
	var quaternion = getBaseQuaternion(
		orientation.alpha,
		orientation.beta,
		orientation.gamma
	); // q

	var worldTransform = getWorldTransformationQuaternion(); // q_w

	var worldAdjustedQuaternion = quaternionMultiply( quaternion, worldTransform ); // q'_w

	var screenTransform = getScreenTransformationQuaternion( customerDeviceInitialOrientation.alpha ); // q_s

	var finalQuaternion = quaternionMultiply( worldAdjustedQuaternion, screenTransform ); // q'_s

	return finalQuaternion; // [ w, x, y, z ]
}

console.log("computeQuaternion",computeQuaternion(customerDeviceInitialOrientation));
console.log("computeQuaternion",computeQuaternion(customerDeviceOrientation));


