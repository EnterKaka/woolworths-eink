import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
//open file dialog
function open_model(){
    $("#input_model").trigger("click");
}

$('#input_model').change(modelFileFromPC);

function modelFileFromPC(e) {
    var files = e.target.files;
    if (files.length < 1) {
        alert('select a file...');
        return;
    }
    var file = files[0];
    var reader = new FileReader();
    reader.onload = onFileLoaded;
    reader.readAsDataURL(file);
}

function onFileLoaded (e) {
    var match = /^data:(.*);base64,(.*)$/.exec(e.target.result);
    if (match == null) {
        throw 'Could not parse result'; // should not happen
    }
    var mimeType = match[1];
    var content = match[2];
    alert(mimeType);
    alert(content);
}
var controls, camera, renderer, scene;
//three.js point cloud viewer
function main() {
    const canvas = document.querySelector('#viewer_3d');
    renderer = new THREE.WebGLRenderer({canvas});
  
    const fov = 75;
    const aspect = 2;  // the canvas default
    const near = 0.1;
    const far = 1000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 2;
    camera.position.set( 400, 200, 0 );

    controls = new OrbitControls(camera, renderer.domElement);
		controls.listenToKeyEvents( window ); // optional

				//controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)

		controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
		controls.dampingFactor = 0.05;

		controls.screenSpacePanning = false;

		controls.minDistance = 100;
		controls.maxDistance = 500;

		controls.maxPolarAngle = Math.PI / 2;


    scene = new THREE.Scene();

    var vertices = [];

    // load a resource
    
    // const loader = new PCDLoader();
    // loader.load(
    //   // resource URL
    //   'pointcloud.pcd',
    //   // called when the resource is loaded
    //   function ( mesh ) {
    //     scene.add( mesh );
    //   },
    //   // called when loading is in progresses
    //   function ( xhr ) {
    //     console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    //   },
    //   // called when loading has errors
    //   function ( error ) {
    //     console.log( 'An error happened' );
    //   }
    // );
    for ( let i = 0; i < 10000; i ++ ) {
      var x = THREE.MathUtils.randFloatSpread( 2000 );
      var y = THREE.MathUtils.randFloatSpread( 2000 );
      var z = THREE.MathUtils.randFloatSpread( 2000 );
      vertices.push( x, y, z );
    }
    
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
    
    var material = new THREE.PointsMaterial( { color: 0x00ff00 } );
    
    var points = new THREE.Points( geometry, material );
    
    scene.add( points );
    
    animate();
    
  }

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render( scene, camera );
  }
  
  main();