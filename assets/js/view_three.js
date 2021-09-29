import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { PCDLoader } from './PCDLoader.js';
import { XYZLoader } from './XYZLoader.js';

//open file dialog
function btn_open_model(){
    $("#input_model").trigger("click");
}

$('#input_model').change(openModel_Fromlocal);

function openModel_Fromlocal(e) {
    var files = e.target.files;
    if (files.length < 1) {
        alert('select a file...');
        return;
    }
    var file = files[0];
    var reader = new FileReader();
    var model_text;
    reader.addEventListener("load", () => {
      // this will then display a text file
      model_text = reader.result;
      // console.log(model_text);
      // parse( model_text );

      var lines = model_text.split( '\n' );

      var vertices = [];
      var colors = [];
      var points2;
      for ( let line of lines ) {
        line = line.trim();
        if ( line.charAt( 0 ) === '#' ) continue; // skip comments
        var lineValues = line.split( /\s+/ );
        if ( lineValues.length === 3 ) {
        // XYZ
        vertices.push( parseFloat( lineValues[ 0 ] ) );
        vertices.push( parseFloat( lineValues[ 1 ] ) );
        vertices.push( parseFloat( lineValues[ 2 ] ) );
        }
        if ( lineValues.length === 6 ) {
          // XYZRGB
          vertices.push( parseFloat( lineValues[ 0 ] ) );
          vertices.push( parseFloat( lineValues[ 1 ] ) );
          vertices.push( parseFloat( lineValues[ 2 ] ) );

          colors.push( parseFloat( lineValues[ 3 ] ) / 255 );
          colors.push( parseFloat( lineValues[ 4 ] ) / 255 );
          colors.push( parseFloat( lineValues[ 5 ] ) / 255 );
        }
      }
      var geometry1 = new THREE.BufferGeometry();
      geometry1.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

      if ( colors.length > 0 ) {
        geometry1.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
      }

      geometry1.center();

      var vertexColors = ( geometry1.hasAttribute( 'color' ) === true );

      var material = new THREE.PointsMaterial( { size: 0.1, vertexColors: vertexColors } );

      points2 = new THREE.Points( geometry1, material );
      scene.add( points2 );
      render();
    }, false);
  
    if (file) {
      reader.readAsText(file);
    }
}

var controls, camera, renderer, scene, canvas, parent_canvas;
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
    var far = 1000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set( 20, 20, 0 );
    scene.add(camera);

    controls = new OrbitControls(camera, renderer.domElement);
		controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
		controls.minDistance = 0.1;
		controls.maxDistance = 100;

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
     loader.load( './3dmodels/Weissspat_1632872292.txt', function ( geometry ) {

      geometry.center();

      var vertexColors = ( geometry.hasAttribute( 'color' ) === true );

      var material = new THREE.PointsMaterial( { size: 0.1, vertexColors: vertexColors } );

      points1 = new THREE.Points( geometry, material );
      // scene.add( points1 );
      render();

    } );
    parent_canvas = document.getElementById('main_canvas');
    $('#btn-openfromLocal').click(function(){
      btn_open_model();
    })

    // resize canvas when Toggle fullscreen
    $('a[data-action="expand"]').on('click',async function(e) {
      await new Promise(r => setTimeout(r, 10));
      onWindowResize();
    });
    window.addEventListener('resize', onWindowResize);
  }

  function onWindowResize(){
    camera.aspect = parent_canvas.clientWidth/parent_canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(parent_canvas.clientWidth,parent_canvas.clientHeight);
  }

  function render(){
    renderer.render( scene, camera);
  }

  function openModelFromMongoDB() {
    
  }
  main();