var renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = 'fixed';
document.body.appendChild(renderer.domElement);

var scene = new THREE.Scene();

//camera
var fov = 45; // camera field-of-view in degrees
var width = renderer.domElement.width;
var height = renderer.domElement.height;
var aspect = width / height; // view aspect ratio
var camera = new THREE.PerspectiveCamera( fov, aspect );
camera.position.z = -500;
camera.position.y = 000;
camera.lookAt(scene.position);

controls = new THREE.OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = false;

//lights
ambientLight = new THREE.AmbientLight( 0xffffff );
scene.add( ambientLight );
//var light = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.9 );
//var light = new THREE.PointLight( 0xffffff, 1 );
//light.position = camera.position;
//scene.add( light );

//shaders
var loader = new THREE.TextureLoader();
var img = loader.load('img.jpg');
var texture = loader.load('filter_NRM.jpg');
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
console.log(texture);
var parameters = {
	//color: 0x2194ce,
	//emissive: 0x000000,
	//specular: 0x111111,
	//shininess: 30,
	//shading: THREE.SmoothShading,
	//needsUpdate: true,
	map: img,
	//normalMap: texture,
	//normalScale: new THREE.Vector2( 0.6, 0.6 ),
	//morphTargets: true,
	//morphNormals: true,
	//normalScale: new THREE.Vector2( 0, 1 ),
	displacementMap: texture,
	//displacementScale: 100
}
var material = new THREE.MeshPhongMaterial( parameters );

//geometry
geometry = new THREE.PlaneGeometry(500, 281, 500, 281);

var plane = new THREE.Mesh( geometry, material);
plane.rotation.y = Math.PI;
scene.add(plane);
