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
      reloadModelFromData(file.name,model_text);
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
    //scene background color
    // scene.background = new THREE.Color( 0xffffff );
    //set axis
    var axes = new THREE.AxisHelper(20);
    scene.add(axes);
    //set grid helper
    var gridXZ = new THREE.GridHelper(0, 0);
    gridXZ.setColors(new THREE.Color(0x006600), new THREE.Color(0x006600));
    scene.add(gridXZ);

    var gridXY = new THREE.GridHelper(30, 60);
    gridXY.rotation.x = Math.PI / 2;
    gridXY.setColors(new THREE.Color(0x000066), new THREE.Color(0x000066));
    scene.add(gridXY);

    var gridYZ = new THREE.GridHelper(30, 60);
    gridYZ.rotation.z = Math.PI / 2;
    gridYZ.setColors(new THREE.Color(0x660000), new THREE.Color(0x660000));
    // scene.add(gridYZ);

    var fov = 60;
    var aspect = canvas.clientWidth/canvas.clientHeight;  // the canvas default
    var near = 0.01;
    var far = 1000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set( 0, -20, 6 );
    camera.lookAt(0,0,0);
    scene.add(camera);

    controls = new OrbitControls(camera, renderer.domElement);
		controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
		controls.minDistance = 0.1;
		controls.maxDistance = 100;
    controls.enableRotate = true;
    controls.maxPolarAngle = Infinity;
    // controls.maxPolarAngle(Math.PI);

    // load a resource
    // var loader = new PCDLoader();
    // loader.load( '../3dmodels/Zaghetto.pcd', function ( points ) {

    //   points.geometry.center();
    //   points.geometry.rotateX( Math.PI );
    //   scene.add( points );

    //   render();

    // } );
    var points1, pointcloud;
    
    var loader = new XYZLoader();
    var tempvaluetag = document.getElementById('pointcloud');
    if(tempvaluetag){
      pointcloud = tempvaluetag.value;
      pointcloud = JSON.parse(pointcloud);
      reloadModelFromJSONData('AeraOfInterest',pointcloud);

    }else{
      loader.load( './3dmodels/Weissspat_1632872292.txt', function ( geometry ) {
        $('#modelpath').html('Weissspat_1632872292.txt');
        geometry.center();

        var vertexColors = ( geometry.hasAttribute( 'color' ) === true );

        var material = new THREE.PointsMaterial( { size: 0.1, vertexColors: vertexColors } );

        points1 = new THREE.Points( geometry, material );
        scene.add( points1 );
        render();

      } );
    }
    
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
    




    //drag and drop
    // While dragging the p element, change the color of the output text
    document.addEventListener("drag", function(event) {
      document.getElementById("viewer_3d").style.color = "red";
    });

    // Output some text when finished dragging the p element and reset the opacity
    document.addEventListener("dragend", function(event) {
      document.getElementById("viewer_3d").innerHTML = "Finished dragging the p element.";
      event.target.style.opacity = "1";
    });

    /* Events fired on the drop target */

    // When the draggable p element enters the droptarget, change the DIVS's border style
    document.addEventListener("dragenter", function(event) {
      if ( event.target.className == "3dviewer" ) {
        event.target.style.border = "3px dotted red";
      }
    });

    // By default, data/elements cannot be dropped in other elements. To allow a drop, we must prevent the default handling of the element
    document.addEventListener("dragover", function(event) {
      event.preventDefault();
    });

    // When the draggable p element leaves the droptarget, reset the DIVS's border style
    document.addEventListener("dragleave", function(event) {
      if ( event.target.className == "3dviewer" ) {
        event.target.style.border = "";
      }
    });

    /* On drop - Prevent the browser default handling of the data (default is open as link on drop)
      Reset the color of the output text and DIV's border color
      Get the dragged data with the dataTransfer.getData() method
      The dragged data is the id of the dragged element ("drag1")
      Append the dragged element into the drop element
    */
    document.addEventListener("drop", function(event) {
      event.preventDefault();
      if ( event.target.className == "3dviewer" ) {
        document.getElementById("viewer_3d").style.color = "";
        event.target.style.border = "";
        var file = event.dataTransfer.files[0];
        var reader = new FileReader();
        reader.onload = function(ev) {
            var model_text = ev.target.result;
            reloadModelFromData(file.name,model_text);
          };

        reader.readAsText(file);
      }
    });
  }

  function onWindowResize(){
    camera.aspect = parent_canvas.clientWidth/parent_canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize((parent_canvas.clientWidth-30),parent_canvas.clientHeight);
  }

  function render(){
    renderer.render( scene, camera);
  }

  function reloadModelFromData(filename,wholecontent) {
    $('#modelpath').html(filename);
    var lines = wholecontent.split( '\n' );

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

      //set rgb from xyz
      colors.push(255);
      colors.push(255);
      let zvalue = parseFloat( lineValues[2]);
      let zcolor = (1 - Math.abs(zvalue))*255/1;
      colors.push(zcolor);
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
    
    while(scene.children.length > 0){ 
      scene.remove(scene.children[0]); 
    }
    //draw axis
    var axes = new THREE.AxisHelper(20);
    scene.add(axes);
    //set grid helper
    var gridXZ = new THREE.GridHelper(0, 0);
    gridXZ.setColors(new THREE.Color(0x006600), new THREE.Color(0x006600));
    scene.add(gridXZ);

    var gridXY = new THREE.GridHelper(30, 60);
    gridXY.rotation.x = Math.PI / 2;
    gridXY.setColors(new THREE.Color(0x000066), new THREE.Color(0x000066));
    scene.add(gridXY);

    var gridYZ = new THREE.GridHelper(30, 60);
    gridYZ.rotation.z = Math.PI / 2;
    gridYZ.setColors(new THREE.Color(0x660000), new THREE.Color(0x660000));
    // scene.add(gridYZ);

    points2 = new THREE.Points( geometry1, material );
    scene.add( points2 );
    render();
  }

  function reloadModelFromJSONData(filename,wholecontent) {
    $('#modelpath').html(filename);
    var vertices = [];
    var colors = [];
    var points2;

    wholecontent.forEach(function (xyz) {
      vertices.push( parseFloat( xyz.x ) );
      vertices.push( parseFloat( xyz.y ) );
      vertices.push( parseFloat( xyz.z ) );
      
      //set color from xyz
      colors.push(255);
      colors.push(255);
      let zvalue = parseFloat( xyz.z);
      let zcolor = (1 - Math.abs(zvalue))*255/1;
      colors.push(zcolor);
    });
    
    var geometry1 = new THREE.BufferGeometry();
    geometry1.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

    if ( colors.length > 0 ) {
      geometry1.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
    }

    geometry1.center();

    var vertexColors = ( geometry1.hasAttribute( 'color' ) === true );

    var material = new THREE.PointsMaterial( { size: 0.1, vertexColors: vertexColors } );
    
    while(scene.children.length > 0){ 
      scene.remove(scene.children[0]); 
    }
    
    //draw axis
    var axes = new THREE.AxisHelper(20);
    scene.add(axes);
    //set grid helper
    var gridXZ = new THREE.GridHelper(0, 0);
    gridXZ.setColors(new THREE.Color(0x006600), new THREE.Color(0x006600));
    scene.add(gridXZ);

    var gridXY = new THREE.GridHelper(30, 60);
    gridXY.rotation.x = Math.PI / 2;
    gridXY.setColors(new THREE.Color(0x000066), new THREE.Color(0x000066));
    scene.add(gridXY);

    var gridYZ = new THREE.GridHelper(30, 60);
    gridYZ.rotation.z = Math.PI / 2;
    gridYZ.setColors(new THREE.Color(0x660000), new THREE.Color(0x660000));
    // scene.add(gridYZ);

    points2 = new THREE.Points( geometry1, material );
    scene.add( points2 );
    render();
  }

  //main load
  main();