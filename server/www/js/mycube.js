var TheCube = function () {
	Math.radians = function(degrees) {
	    return degrees * Math.PI / 180;
	};
	this.camera,
	this.scene,
	this.renderer;
	this.geometry;
	var qFromMPU = new THREE.Quaternion();
	var q = new THREE.Quaternion();
	var qCalibrate = new THREE.Quaternion();
	var mCalibrate = new THREE.Matrix4();
	var mRotation = new THREE.Matrix4();
	var material;
	var cube;
	var object;
	var angle = 0;
	function init() {
		var canvasWidth = 846;
		var canvasHeight = 494;
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setSize(window.innerWidth / 2, window.innerHeight / 2);

		this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
		//this.camera.position.z = 5;
		this.camera.position.set(0,-2,2);
		var lookatdirection = new THREE.Vector3( 0, -1, 1);		
		this.camera.lookAt(lookatdirection);

	}

	function fillScene() {
		this.scene = new THREE.Scene();

		// LIGHTS
		this.scene.add(new THREE.AmbientLight(0x222222));

		headlight = new THREE.PointLight(0xFFFFFF, 1.0);
		this.scene.add(headlight);

		var light = new THREE.SpotLight(0xFFFFFF, 1.0);
		light.position.set(-600, -600, 300);
		light.angle = 20 * Math.PI / 180;
		light.exponent = 1;
		light.target.position.set(0, 0, 0);
		light.castShadow = true;

		this.scene.add(light);

		var lightSphere = new THREE.Mesh(
				new THREE.SphereGeometry(10, 12, 6),
				new THREE.MeshBasicMaterial());
		lightSphere.position.copy(light.position);

		this.scene.add(lightSphere);

		this.geometry = new THREE.BoxGeometry(2, 0.5, 3);
		material = new THREE.MeshBasicMaterial({
				color : 0x301e10
			});
		var cubeMaterial = new THREE.MeshPhongMaterial({
				shininess : 4
			});
		cubeMaterial.color.setHex(0xAdA79b);
		cubeMaterial.specular.setRGB(0.5, 0.5, 0.5);
		cubeMaterial.ambient.copy(cubeMaterial.color);
		//cube = new THREE.Mesh(this.geometry, material);
		cube = new THREE.Mesh(this.geometry, cubeMaterial);
		cube.position.x = 0;
		cube.position.y = 0;
		cube.position.z = 0;
		//this.scene.add(cube);
		object = new THREE.Object3D();
		scene.add(object);
		object.add(cube);
	}

	function animate() {
		window.requestAnimationFrame(animate);
		render();
	}
	var render = function () {
		requestAnimationFrame(render);
		cube.setRotationFromQuaternion(q);
		// cube.rotation.x = Math.radians(x);
		// cube.rotation.z = -Math.radians(y)

			this.renderer.render(this.scene, this.camera);
	};

	function addToDOM() {
		var container = document.getElementById('container');
		var canvas = container.getElementsByTagName('canvas');
		if (canvas.length > 0) {
			container.removeChild(canvas[0]);
		}
		container.appendChild(this.renderer.domElement);
	}
	this.kickoffcube = function() {
		init();
		fillScene();
		addToDOM();
		render();
	}
	this.setCalibration = function() {
		//we invert the Quaternion from MPU current reading and set it to the calibration Quaternion
		//qCalibrate.copy(qFromMPU).inverse();
		//console.log("Calibrate Quaternion:",qCalibrate);
		mCalibrate.getInverse(this.QtoM(qFromMPU));
		console.log("Calibrate Matrix:",mCalibrate.elements);
	}
	this.setRotation = function(qq) {
		//read the Quaternion from MPU
		qFromMPU.set(qq._x,qq._y,qq._z,qq._w);
		//apply the calibration Quaternion
		//q.multiplyQuaternions(qCalibrate,qFromMPU);
// 		cube.(mselfInverse);
 		mRotation.multiplyMatrices(this.QtoM(qFromMPU), mCalibrate);
		q.setFromRotationMatrix(mRotation);
// 		cube.applyMatrix( mRotation ); // CHANGED
	}
	this.QtoM = function(q){
	    var m = new THREE.Matrix4(	1.0 - 2.0*q.y*q.y - 2.0*q.z*q.z, 	2.0*q.x*q.y - 2.0*q.z*q.w, 		2.0*q.x*q.z + 2.0*q.y*q.w, 		0.0,
					2.0*q.x*q.y + 2.0*q.z*q.w, 		1.0 - 2.0*q.x*q.x - 2.0*q.z*q.z, 	2.0*q.y*q.z - 2.0*q.x*q.w, 		0.0,
					2.0*q.x*q.z - 2.0*q.y*q.w, 		2.0*q.y*q.z + 2.0*q.x*q.w, 		1.0 - 2.0*q.x*q.x - 2.0*q.y*q.y, 	0.0,
					0.0, 					0.0, 					0.0, 					1.0);
	    return m;
	}
	// setInterval(function () {
	// if (angle < Math.PI * 2.0) {
	// angle += Math.PI / 1800.0;
	// } else {
	// angle = 0;
	// }
	// x = Math.random() * 0.1 + (Math.sin(angle) + 1) * 10;
	// y = Math.random() * 0.1 + (Math.cos(angle + 1.0) + 1) * 10;
	// }, 50);
};
