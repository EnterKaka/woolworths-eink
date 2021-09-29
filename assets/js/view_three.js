import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { PCDLoader } from './PCDLoader.js';
import { XYZLoader } from './XYZLoader.js';

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
var controls, camera, renderer, scene, canvas;
//three.js point cloud viewer
function main() {
    canvas = document.querySelector('#viewer_3d');
    renderer = new THREE.WebGLRenderer({canvas, antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    scene = new THREE.Scene();

    var fov = 30;
    var aspect = canvas.clientWidth/canvas.clientHeight;  // the canvas default
    var near = 0.01;
    var far = 500;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set( 0, 0, 1 );
    scene.add(camera);

    controls = new OrbitControls(camera, renderer.domElement);
		controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
		controls.minDistance = 0.5;
		controls.maxDistance = 10;

    // load a resource
    // var loader = new PCDLoader();
    // loader.load( '../3dmodels/Zaghetto.pcd', function ( points ) {

    //   points.geometry.center();
    //   points.geometry.rotateX( Math.PI );
    //   scene.add( points );

    //   // render();

    // } );

     var loader = new XYZLoader();
     var points1;
     loader.load( './3dmodels/model1.xyz', function ( geometry ) {

      geometry.center();

      const vertexColors = ( geometry.hasAttribute( 'color' ) === true );

      const material = new THREE.PointsMaterial( { size: 0.1, vertexColors: vertexColors } );

      points1 = new THREE.Points( geometry, material );
      scene.add( points1 );
      render();

    } );

    window.addEventListener('resize', onWindowResize);
  }

  // function animate() {
  //   requestAnimationFrame(animate);
  //   controls.update();
  //   render();
  // }
  
  function onWindowResize(){
    camera.aspect = canvas.clientWidth/canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth,canvas.clientHeight);
  }

  function render(){
    renderer.render( scene, camera);
  }
  main();