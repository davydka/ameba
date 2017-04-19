var camera, scene, renderer, controls;

init();
animate2();

function init()
{	
    // basic scene
    renderer = new THREE.WebGLRenderer( {antialias:true} );
	var width = window.innerWidth;
	var height = window.innerHeight;

    renderer.setSize (width, height);
    
	document.body.appendChild (renderer.domElement);

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera (45, width/height, 1, 10000);
	camera.position.y = 16;
	camera.position.z = 350;
/*
    controls = new THREE.OrbitControls (camera, renderer.domElement);
    controls.rotateSpeed = 0.3;
    controls.enableDamping = true;
	controls.dampingFactor = 0.25;
       */

    var loader = new THREE.TextureLoader();
    loader.crossOrigin = '';
    var texture = loader.load('http://2.bp.blogspot.com/-Jfw4jY6vBWM/UkbwZhdKxuI/AAAAAAAAK94/QTmtnuDFlC8/s1600/2_no_clouds_4k.jpg' );
    
    // globe
    var material = new THREE.MeshPhongMaterial( {
        color: 0xffffff,
        map: texture,
       	displacementMap: texture,
        displacementScale: 10
    } );
    
    var sphere = new THREE.Mesh( new THREE.SphereGeometry( 100, 32, 32 ), material );
    scene.add( sphere );
    
    var al = new THREE.AmbientLight( 0x444444 );
    scene.add( al );
    
    var dl = new THREE.DirectionalLight( 0xffffff, 1 );
    scene.add( dl );
    dl.position.set( 1, 1, 1.6 );
    
}

function animate2() {
    //controls.update();
 	requestAnimationFrame( animate2 );
    renderer.render( scene, camera );
}
