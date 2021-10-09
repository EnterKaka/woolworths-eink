import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
// import { PCDLoader } from './PCDLoader.js';
import { XYZLoader, getminmaxhegiht, getrgb, init_highlow } from './XYZLoader.js';
import { TrackballControls } from './TrackballControls.js';

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

var controls, camera, renderer, scene, canvas, parent_canvas, group;
//three.js point cloud viewer
function main() {
    canvas = document.querySelector('#viewer_3d');

    var mouseDown = false,
        mouseX = 0,
        mouseY = 0;

    canvas.addEventListener('mousemove', function (e) {
        onMouseMove(e);
    }, false);
    canvas.addEventListener('mousedown', function (e) {
      if(e.button == 0) {
        onMouseDown(e);
      }
    }, false);
    canvas.addEventListener('mouseup', function (e) {
        onMouseUp(e);
    }, false);

    renderer = new THREE.WebGLRenderer({canvas, antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    scene = new THREE.Scene();
    //scene background color
    // scene.background = new THREE.Color( 0x333333 );
    // //set axis
    // var axes = new THREE.AxesHelper(20);
    // scene.add(axes);
    // // //set grid helper
    // var gridXZ = new THREE.GridHelper(0, 0);
    // scene.add(gridXZ);

    // var gridXY = new THREE.GridHelper(30, 60);
    // gridXY.rotation.x = Math.PI / 2;
    // scene.add(gridXY);

    // var gridYZ = new THREE.GridHelper(30, 60);
    // gridYZ.rotation.z = Math.PI / 2;

    var fov = 60;
    var aspect = canvas.clientWidth/canvas.clientHeight;  // the canvas default
    var near = 0.01;
    var far = 1000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set( 0, -20, 6 );
    camera.lookAt(0,0,0);
    scene.add(camera);
    
    //natural rotate control
    controls = new OrbitControls(camera, renderer.domElement);
		// controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
		controls.minDistance = 0.1;
		controls.maxDistance = 100;
    controls.enableRotate = true;
    controls.maxPolarAngle = Infinity;
    controls.enableRotate = false;
    // controls.autoRotate = true
    controls.enableDamping = true;
    // controls.maxPolarAngle(Math.PI);
    
    //new rotate 360 control
    // controls = new TrackballControls(camera, renderer.domElement);
    // controls.rotateSpeed = 3.8;
    // controls.zoomSpeed = 1.2;
    // controls.panSpeed = 1.8;
    // controls.keys = [ 'keyA', 'keyS', 'keyD' ];
    // controls.noRotate = true;

    // load a resource pcd file load
    // var loader = new PCDLoader();
    // loader.load( '../3dmodels/Zaghetto.pcd', function ( points ) {

    // points.geometry.center();
    // points.geometry.rotateX( Math.PI );
    // scene.add( points );

    // render();

    // } );
    group = new THREE.Object3D();
    var points1, pointcloud;
    var loader = new XYZLoader();
    var tempvaluetag = document.getElementById('pointcloud');
    if(tempvaluetag){
      pointcloud = tempvaluetag.value;
      pointcloud = JSON.parse(pointcloud);
      let modelname = '';
      reloadModelFromJSONData(modelname,pointcloud);

    }else{
      loader.load( './3dmodels/owleyeweb.txt', function ( geometry ) {
        $('#modelpath').html('owleyeweb.txt');
        geometry.center();

        var vertexColors = ( geometry.hasAttribute( 'color' ) === true );

        var material = new THREE.PointsMaterial( { size: 0.1, vertexColors: vertexColors } );

        points1 = new THREE.Points( geometry, material );
        group.add( points1 );
        render();

      } );
    }
    scene.add(group);
    
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

    function onMouseMove(evt) {
        if (!mouseDown) {
            return;
        }
        evt.preventDefault();

        var deltaX = evt.clientX - mouseX,
            deltaY = evt.clientY - mouseY;
        mouseX = evt.clientX;
        mouseY = evt.clientY;
        rotateScene(deltaX, deltaY);
    }

    function onMouseDown(evt) {
        evt.preventDefault();

        mouseDown = true;
        mouseX = evt.clientX;
        mouseY = evt.clientY;
    }

    function onMouseUp(evt) {
        evt.preventDefault();

        mouseDown = false;
    }

    function rotateScene(deltaX, deltaY) {
        group.rotation.z += deltaX / 100;
        group.rotation.x += deltaY / 100;
    } 
  }

  function onWindowResize(){
    camera.aspect = parent_canvas.clientWidth/parent_canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize((parent_canvas.clientWidth-30),parent_canvas.clientHeight);
    // controls.handleResize();
  }

  function render(){
    renderer.render( scene, camera);
  }

  function animate(){
    requestAnimationFrame( animate );

    controls.update();

    // stats.update();

    render();
  }

  function reloadModelFromData(filename,wholecontent) {
    $('#modelpath').html(filename);
    var lines = wholecontent.split( '\n' );
    getminmaxhegiht(lines);
    var vertices = [];
    var colors = [];
    var points2;

    var values = getminmaxhegiht(lines);
    var min = values[0];
    var max = values[1];

    for ( let line of lines ) {
      line = line.trim();
      if ( line.charAt( 0 ) === '#' ) continue; // skip comments
      var lineValues = line.split( /\s+/ );
      if ( lineValues.length === 3 ) {
      // XYZ
      vertices.push( parseFloat( lineValues[ 0 ] ) );
      vertices.push( parseFloat( lineValues[ 1 ] ) );
      vertices.push( parseFloat( lineValues[ 2 ] ) );
      
      let zvalue = parseFloat( lineValues[ 2 ] );
      //set rgb from xyz
      let k=(zvalue - min)/(max - min);
      let rgb = getrgb(k);
      //set color from xyz
      colors.push(rgb[0]);
      colors.push(rgb[1]);
      colors.push(rgb[2]);
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
    
    while(group.children.length > 0){ 
      group.remove(group.children[0]); 
    }
    //draw axis
    // var axes = new THREE.AxesHelper(20);
    // scene.add(axes);
    // //set grid helper
    // var gridXZ = new THREE.GridHelper(0, 0);
    // scene.add(gridXZ);

    // var gridXY = new THREE.GridHelper(30, 60);
    // gridXY.rotation.x = Math.PI / 2;
    // scene.add(gridXY);

    // var gridYZ = new THREE.GridHelper(30, 60);
    // gridYZ.rotation.z = Math.PI / 2;

    points2 = new THREE.Points( geometry1, material );
    group.add( points2 );
    // scene.add( points2 );
    render();
  }

  async function reloadModelFromJSONData(filename,wholecontent) {
    var vertices = [];
    var colors = [];
    var points2;

    var values = getminmaxheightfromjson(wholecontent);
    var min = values[0];
    var max = values[1];

    wholecontent.forEach(function (xyz) {
      vertices.push( parseFloat( xyz.x ) );
      vertices.push( parseFloat( xyz.y ) );
      vertices.push( parseFloat( xyz.z ) );
      
      let zvalue = parseFloat( xyz.z );
      let k = (zvalue - min)/(max - min);
      let rgb = getrgb(k);
      //set color from xyz
      colors.push(rgb[0]);
      colors.push(rgb[1]);
      colors.push(rgb[2]);
    });
    
    var geometry1 = new THREE.BufferGeometry();
    geometry1.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

    if ( colors.length > 0 ) {
      geometry1.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
    }

    geometry1.center();

    var vertexColors = ( geometry1.hasAttribute( 'color' ) === true );

    var material = new THREE.PointsMaterial( { size: 0.1, vertexColors: vertexColors } );
    
    while(group.children.length > 0){ 
      group.remove(group.children[0]); 
    }
    
    //draw axis
    // var axes = new THREE.AxesHelper(20);
    // scene.add(axes);
    // //set grid helper
    // var gridXZ = new THREE.GridHelper(0, 0);
    // scene.add(gridXZ);

    // var gridXY = new THREE.GridHelper(30, 60);
    // gridXY.rotation.x = Math.PI / 2;
    // scene.add(gridXY);

    // var gridYZ = new THREE.GridHelper(30, 60);
    // gridYZ.rotation.z = Math.PI / 2;

    points2 = new THREE.Points( geometry1, material );
    group.add( points2 );
    // scene.add( points2 );
    render();
  }


  /*function getminmaxhegiht(lines){
    var min=Infinity, max=-Infinity, values=[];
    let zvalue;
    for ( let line of lines ) {
      line = line.trim();
      if ( line.charAt( 0 ) === '#' ) continue; // skip comments
      var lineValues = line.split( /\s+/ );
      if ( lineValues.length === 3 ) {
        zvalue = parseFloat(lineValues[2]);
        if( min>zvalue){
          min=zvalue;
        }
        if(max<zvalue){
          max=zvalue;
        }
      }
    }
    values.push(min);
    values.push(max);
    return values;
  }*/

  function getminmaxheightfromjson(lines){
    var min=Infinity, max=-Infinity, values=[];
    let zvalue;

    lines.forEach( function (line) {
      zvalue = parseFloat(line.z);
      if( min>zvalue){
        min=zvalue;
      }
      if(max<zvalue){
        max=zvalue;
      }
    });

    values.push(min);
    values.push(max);
    return values;
  }

  //main load

  init_highlow();

  main();

  animate();