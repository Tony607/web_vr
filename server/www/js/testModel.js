////////////////////////////////////////////////////////////////////////////////
// Basic robot arm: forearm and upper arm
////////////////////////////////////////////////////////////////////////////////

/*global THREE, Coordinates, $, document, window, dat*/

var camera, scene, renderer;
var cameraControls, effectController;
var clock = new THREE.Clock();
var gridX = true;
var gridY = false;
var gridZ = false;
var axes = true;
var ground = true;
var arm, forearm;
var mForearmGFixedRot =  new THREE.Matrix4();
var onlyonece = true;
var cnt = -90;
function fillScene() {
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );

	// LIGHTS
	var ambientLight = new THREE.AmbientLight( 0x222222 );

	var light = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
	light.position.set( 200, 400, 500 );
	
	var light2 = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
	light2.position.set( -500, 250, -200 );

	scene.add(ambientLight);
	scene.add(light);
	scene.add(light2);

	if (ground) {
		Coordinates.drawGround({size:10000});		
	}
	if (gridX) {
		Coordinates.drawGrid({size:10000,scale:0.01});
	}
	if (gridY) {
		Coordinates.drawGrid({size:10000,scale:0.01, orientation:"y"});
	}
	if (gridZ) {
		Coordinates.drawGrid({size:10000,scale:0.01, orientation:"z"});	
	}
	if (axes) {
		Coordinates.drawAllAxes({axisLength:200,axisRadius:1,axisTess:50});
	}
	
	var robotBaseMaterial = new THREE.MeshPhongMaterial( { color: 0x6E23BB, specular: 0x6E23BB, shininess: 20 } );
	var robotForearmMaterial = new THREE.MeshPhongMaterial( { color: 0xF4C154, specular: 0xF4C154, shininess: 100 } );
	var robotUpperArmMaterial = new THREE.MeshPhongMaterial( { color: 0x95E4FB, specular: 0x95E4FB, shininess: 100 } );

	var torus = new THREE.Mesh( 
		new THREE.TorusGeometry( 22, 15, 32, 32 ), robotBaseMaterial );
	torus.rotation.x = 90 * Math.PI/180;
	scene.add( torus );

	forearm = new THREE.Object3D();
	var faLength = 80;

	createRobotExtender( forearm, faLength, robotForearmMaterial );

	arm = new THREE.Object3D();
	var uaLength = 120;	
	
	createRobotCrane( arm, uaLength, robotUpperArmMaterial );
	
	// Move the forearm itself to the end of the upper arm.
	forearm.position.y = uaLength;	
	arm.add( forearm );
	
	scene.add( arm );
}

function createRobotExtender( part, length, material )
{
	var cylinder = new THREE.Mesh( 
		new THREE.CylinderGeometry( 22, 22, 6, 32 ), material );
	part.add( cylinder );

	var i;
	for ( i = 0; i < 4; i++ )
	{
		var box = new THREE.Mesh( 
			new THREE.BoxGeometry( 4, length, 4 ), material );
		box.position.x = (i < 2) ? -4 : 8;
		box.position.y = length/2;
		box.position.z = (i%2) ? -8 : 8;
		part.add( box );
	}
	
	cylinder = new THREE.Mesh( 
		new THREE.CylinderGeometry( 15, 15, 40, 32 ), material );
	cylinder.rotation.x = 90 * Math.PI/180;
	cylinder.position.y = length;
	part.add( cylinder );
}

function createRobotCrane( part, length, material )
{
	var box = new THREE.Mesh( 
		new THREE.BoxGeometry( 18, length, 18 ), material );
	box.position.y = length/2;
	part.add( box );
	
	var sphere = new THREE.Mesh( 
		new THREE.SphereGeometry( 20, 32, 16 ), material );
	// place sphere at end of arm
	sphere.position.y = length;
	part.add( sphere );
}

function init() {
	var canvasWidth = window.innerWidth;
	var canvasHeight = window.innerHeight;
	var canvasRatio = canvasWidth / canvasHeight;

	// RENDERER
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.setSize(canvasWidth, canvasHeight);
	renderer.setClearColor( 0xAAAAAA, 1.0 );

	var container = document.getElementById('container');
	container.appendChild( renderer.domElement );

	// CAMERA
	camera = new THREE.PerspectiveCamera( 30, canvasRatio, 1, 10000 );
	camera.position.set( -510, 240, 100 );
	// CONTROLS
	cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
	
	fillScene();

}

function animate() {
	window.requestAnimationFrame(animate);
	render();
}

function render() {
	cameraControls.update();

	if ( effectController.newGridX !== gridX || effectController.newGridY !== gridY || effectController.newGridZ !== gridZ || effectController.newGround !== ground || effectController.newAxes !== axes)
	{
		gridX = effectController.newGridX;
		gridY = effectController.newGridY;
		gridZ = effectController.newGridZ;
		ground = effectController.newGround;
		axes = effectController.newAxes;

		fillScene();
	}
	if(cnt<180){
		cnt = cnt + 0.5;
	}
	else{
		cnt = -180
	}
	//arm.rotation.x = effectController.ux * Math.PI/180;	// pitch
	arm.rotation.x = cnt * Math.PI/180;	// pitch
	arm.rotation.y = effectController.uy * Math.PI/180;	// yaw
	arm.rotation.z = effectController.uz * Math.PI/180;	// roll
	
	var mselfInverse = new THREE.Matrix4();
	if(onlyonece){
		onlyonece = false;
		mForearmGFixedRot.extractRotation(forearm.matrixWorld);
	}
	mselfInverse.getInverse(forearm.matrix);
	mselfInverse.extractRotation(mselfInverse);
	//rotate forearm back to local origine
	//forearm.applyMatrix(mselfInverse);
	//apply the local rotation to forearm
	var forearmLocalRot = new THREE.Matrix4();
	forearmLocalRot.getInverse(forearmLocalRot.extractRotation(arm.matrix));
	forearmLocalRot.multiplyMatrices(forearmLocalRot,mForearmGFixedRot);
	forearmLocalRot.extractRotation(forearmLocalRot);
	forearm.applyMatrix(forearmLocalRot.multiplyMatrices(forearmLocalRot,mselfInverse));
	forearm.position.setY(120);
	// forearm.rotation.x = effectController.fx * Math.PI/180;	// pitch
	// forearm.rotation.y = effectController.fy * Math.PI/180;	// yaw
	// forearm.rotation.z = effectController.fz * Math.PI/180;	// roll
	
	renderer.render(scene, camera);
}


function QtoM(q){
	var m = new THREE.Matrix4(	1.0 - 2.0*q.y*q.y - 2.0*q.z*q.z, 	2.0*q.x*q.y - 2.0*q.z*q.w, 		2.0*q.x*q.z + 2.0*q.y*q.w, 		0.0,
				2.0*q.x*q.y + 2.0*q.z*q.w, 		1.0 - 2.0*q.x*q.x - 2.0*q.z*q.z, 	2.0*q.y*q.z - 2.0*q.x*q.w, 		0.0,
				2.0*q.x*q.z - 2.0*q.y*q.w, 		2.0*q.y*q.z + 2.0*q.x*q.w, 		1.0 - 2.0*q.x*q.x - 2.0*q.y*q.y, 	0.0,
				0.0, 					0.0, 					0.0, 					1.0);
	return m;
}

function setupGui() {

	effectController = {

		newGridX: gridX,
		newGridY: gridY,
		newGridZ: gridZ,
		newGround: ground,
		newAxes: axes,
		
		ux: 0.0,
		uy: 0.0,
		uz: 0.0,

		fx: 0.0,
		fy: 0.0,
		fz: 0.0
	};

	var gui = new dat.GUI();
	var h = gui.addFolder("Grid display");
	h.add( effectController, "newGridX").name("Show XZ grid");
	h.add( effectController, "newGridY" ).name("Show YZ grid");
	h.add( effectController, "newGridZ" ).name("Show XY grid");
	h.add( effectController, "newGround" ).name("Show ground");
	h.add( effectController, "newAxes" ).name("Show axes");
	h = gui.addFolder("Arm angles");
	h.add(effectController, "ux", -180.0, 180.0, 0.025).name("Upper arm x");
	h.add(effectController, "uy", -180.0, 180.0, 0.025).name("Upper arm y");
	h.add(effectController, "uz", -45.0, 45.0, 0.025).name("Upper arm z");
	h.add(effectController, "fx", -180.0, 180.0, 0.025).name("Forearm x");
	h.add(effectController, "fy", -180.0, 180.0, 0.025).name("Forearm y");
	h.add(effectController, "fz", -120.0, 120.0, 0.025).name("Forearm z");
}

function takeScreenshot() {
	effectController.newGround = true;
	effectController.newGridX = false;
	effectController.newGridY = false;
	effectController.newGridZ = false;
	effectController.newAxes = false;
	init();
	render();
	var img1 = renderer.domElement.toDataURL("image/png");
	camera.position.set( 400, 500, -800 );
	render();
	var img2 = renderer.domElement.toDataURL("image/png");
	var imgTarget = window.open('', 'For grading script');
	imgTarget.document.write('<img src="'+img1+'"/><img src="'+img2+'"/>');
}

init();
setupGui();
animate();
$("body").keydown(function(event) {
	if (event.which === 80) {
		takeScreenshot();
	}
});