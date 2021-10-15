import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { OBJLoader } from './OBJLoader.js';
import Delaunator from './delaunator.js';
import * as dat from './dat.js';

// import { PCDLoader } from './PCDLoader.js';
import { XYZLoader, getminmaxhegiht, getminmaxhegihtfromarray, getrgb, init_highlow } from './XYZLoader.js';
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
      if(file.name.split('.').pop()=='obj'){
        reloadModelFromObjData(file.name,model_text)   
      }
      else{
        reloadModelFromData(file.name,model_text);
      }
    }, false);
  
    if (file) {
      reader.readAsText(file);
    }
}

var controls, triangle, mouse3, plane,pointOnPlane,target,closestPoint, canvas2;
var camera, count = 0,line, positions, renderer, scene, canvas, parent_canvas;
var group, marker, mesh, raycaster, mouse, toolstate = 'move',lookatP={x:0,y:0,z:0};
var selectedPoints, selectedGroup, polygon=[], drawing=true;
var mouseDown, mouseRightDown, mouseX, mouseY;
//three.js point cloud viewer

function main() {
    canvas = document.querySelector('#viewer_3d');
    canvas2 = document.getElementById('tool_2d');

    mouseDown = false;
    mouseRightDown = false;
    mouseX = 0;
    mouseY = 0;
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    mouse3 = new THREE.Vector2();

    triangle = new THREE.Triangle();
    plane = new THREE.Plane( new THREE.Vector3( 0, 1, 0 ), 0 );
    pointOnPlane = new THREE.Vector3();
    target = new THREE.Vector3();
    closestPoint = new THREE.Vector3();


    const markerGeometry = new THREE.SphereGeometry( 0.05 );
    const makerMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
    markerGeometry.center();
    marker = new THREE.Mesh( markerGeometry, makerMaterial );
    



    //event control
    canvas2.addEventListener('mousemove', function (e) {
      ////console.log('move')
        
      switch(toolstate) {
        case 'move':
          onMouseMove(e);
          onDocumentMouseMove(e)
          // code block
          break;
        case 'point':
          onDocumentMouseMove(e)
          // code block
          break;
        case 'pencil':
          drawPencil(e)
          break;
        default:
          // code block
      }
    }, false);

    canvas2.addEventListener('mousedown', function (e) {
      console.log('down')
      if(e.button == 0) {
        onMouseDown(e);
        switch(toolstate) {
          case 'move':
          
            break;
          case 'point':
            onAddPoint(e)
            break;
          case 'polygon':
            drawPolygon(e)
            break;
          case 'pencil':
            startPencil(e)
            break;
          default:
            // code block
        }
      }
      if(e.button ==2){
        onMouseRightDown(e)
        switch(toolstate) {
          case 'move':
          
            break;
          case 'point':
            onAddPoint(e)
            break;
          case 'polygon':
            drawPolygon(e)
            break;
          case 'pencil':
            startPencil(e)
            break;
          default:
            // code block
        }
      }
      switch(toolstate) {
        case 'move':
        
          break;
        case 'point':
          onAddPoint(e)
          break;
        case 'polygon':
          drawPolygon(e)
          break;
        case 'pencil':
          startPencil(e)
          break;
        default:
          // code block
      }
      
    }, false);

    canvas2.addEventListener('mouseup', function (e) {
      console.log('up')
      if(e.button == 0) {
        onMouseUp(e);
        switch(toolstate){
          case 'pencil':
            finishdraw(e)
            break;
        }
      }
      else if(e.button == 2){
        onMouseRightUp(e)
      }
      
    }, false);

    canvas2.addEventListener('click', function (e) {
      ////console.log('click')
        onMouseMove(e);
    }, false);

    canvas2.addEventListener('dblclick', function (e) {
      ////console.log('dblclick')
      switch(toolstate){
        case 'polygon':
          finishdraw(e)
          break;

      }
    }, false);

    canvas2.addEventListener('contextmenu', (e) => {
      // e.preventDefault();
      ////console.log('rightclick')
        console.log('Success');
      if(e.button == 2){
        console.log('rightclicked')
        onMouseRightUp(e)
      }
    }, false);

    canvas2.addEventListener( 'mousewheel', (e) =>{
      if(toolstate === 'move') 
        onDocumentMouseWheel(e);
    }, false );


    //render, scene
    renderer = new THREE.WebGLRenderer({canvas, antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    scene = new THREE.Scene();
    //scene background color
    scene.background = new THREE.Color( 0x111111 );


    var light = new THREE.DirectionalLight(0xffffff, 1.5);
    // light.position.setScalar(100);
    light.position.set( 0, 20, -26 );
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));


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



    // var geometry5 = new THREE.TorusBufferGeometry( 1, 0.05, 6, 32 );
    // var material5 = new THREE.MeshNormalMaterial();
    // mesh = new THREE.Mesh( geometry5, material5 );
    // scene.add( mesh );
    // scene.add( marker );




    // geometry
    // var MAX_POINTS = 10;
    // positions = new Float32Array(MAX_POINTS * 3);    
    // // positions.push(parseFloat(0),parseFloat(0),parseFloat(0));
    // // var geometry3 = new THREE.BufferGeometry().setFromPoints(positions);
    // var geometry3 = new THREE.BufferGeometry();

    // geometry3.addAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    // // material
    // var material = new THREE.LineBasicMaterial({
    //   color: 0xff0000,
    //   linewidth: 2
    // });

    // // line
    // line = new THREE.Line(geometry3, material);
    // scene.add(line);





    var fov = 60;
    var aspect = canvas.clientWidth/canvas.clientHeight;  // the canvas default
    var near = 0.01;
    var far = 1000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set( 0, -20, 6 );
    // camera.position.setScalar(15);
    camera.lookAt(0,0,0);
    scene.add(camera);
    
    //natural rotate control
    // controls = new OrbitControls(camera, renderer.domElement);
		// controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
		// controls.minDistance = 0.1;
		// controls.maxDistance = 100;
    // controls.enableRotate = true;
    // controls.maxPolarAngle = Infinity;
    // controls.enableRotate = false;
    // controls.autoRotate = true
    // controls.enableDamping = true;
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
    const loader = new THREE.FileLoader();
    var tempvaluetag = document.getElementById('pointcloud');
    if(tempvaluetag){
      pointcloud = tempvaluetag.value;
      pointcloud = JSON.parse(pointcloud);
      let modelname = '';
      reloadModelFromJSONData(modelname,pointcloud);
    }else{
      loader.load( './3dmodels/Weissspat_1632872292.txt', function ( text ) {
        // $('#modelpath').html('Weissspat_1632872292.txt');
        reloadModelFromData('Weissspat_1632872292.txt',text);
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
          if(file.name.split('.').pop()=='obj'){
            reloadModelFromObjData(file.name,model_text)   
          }
          else{
            reloadModelFromData(file.name,model_text);
          }
        };

        reader.readAsText(file);
      }
    });


    function updateLine() {
      raycaster.setFromCamera( mouse, camera );
      raycaster.ray.intersectPlane( plane, pointOnPlane );
      positions[count * 3 - 3] = pointOnPlane.x;
      positions[count * 3 - 2] = pointOnPlane.y;
      positions[count * 3 - 1] = pointOnPlane.z;
      line.geometry.attributes.position.needsUpdate = true;
    }

    function addPoint(event){
      //console.log("point nr " + count + ": " + mouse.x + " " + mouse.y + " " + mouse.z);
      raycaster.setFromCamera( mouse, camera );
      raycaster.ray.intersectPlane( plane, pointOnPlane );
      // positions[count * 3 + 0] = pointOnPlane.x;
      // positions[count * 3 + 1] = pointOnPlane.y;
      // positions[count * 3 + 2] = pointOnPlane.z;
      positions.push(parseFloat(pointOnPlane.x),parseFloat(pointOnPlane.y),parseFloat(pointOnPlane.z))
      count++;
      line.geometry.setDrawRange(0, count);
      updateLine();
    }

    function onMouseMove(evt) {
        evt.preventDefault();
        mouse3.x = mouse.x;
        mouse3.y = mouse.y;
        // mouse3.z = 0;
        // mouse3.unproject(camera);
        // if( count !== 0 ){
        //   updateLine();
        // }


        if (mouseDown) {
          console.log('mousedownmove')
            var deltaX = evt.clientX - mouseX,
            deltaY = evt.clientY - mouseY;
            mouseX = evt.clientX;
            mouseY = evt.clientY;
            //////console.log('moved')
            rotateScene(deltaX, deltaY);
        }
        else if(mouseRightDown){
          console.log('mouserightdown')
            var deltaX = evt.clientX - mouseX,
            deltaY = evt.clientY - mouseY;
            mouseX = evt.clientX;
            mouseY = evt.clientY;
            cameraMove(deltaX, deltaY)
        }

    }

    function onDocumentMouseMove(event) {
      console.log('ondocumentmousemove')
      // alert([event.clientX,"''",event.clientY,"''" ,canvas.clientWidth,"''",canvas.clientHeight])
        // mouse.x = ( event.clientX / canvas.clientWidth ) * 2 - 1;
        // mouse.y = - ( event.clientY / canvas.clientHeight ) * 2 + 1;
        //console.log(event, {canvas})
        mouse.x = ( event.offsetX / canvas.clientWidth ) * 2 - 1;
        mouse.y = - ( event.offsetY / canvas.clientHeight ) * 2 + 1;

        ////console.log(mouse.x, mouse.y)
            
    }

    function onMouseDown(evt) {
      console.log('onmousedown')
        evt.preventDefault();

        mouseDown = true;
        mouseX = evt.clientX;
        mouseY = evt.clientY;

        
    }

    function onMouseUp(evt) {
      console.log('onmouseup')
        evt.preventDefault();

        mouseDown = false;
        
    }

    function onMouseRightDown(evt) {
        evt.preventDefault();
        console.log('down')
        mouseRightDown = true;
        mouseX = evt.clientX;
        mouseY = evt.clientY;
        
    }

    function onMouseRightUp(evt) {
        evt.preventDefault();
        console.log('down')
        mouseRightDown = false;
        
    }

    function onDocumentMouseWheel( event ) {
      console.log('ondocumentmousewheel')
        event.preventDefault();
        camera.position.y -= event.deltaY / 100;        
        camera.position.z += event.deltaY / 100 * 3 / 10;
        lookatP.y -= event.deltaY / 100;        
        lookatP.z += event.deltaY / 100 * 3 / 10;

        camera.lookAt(lookatP.x,lookatP.y,lookatP.z);
        // camera.fov -= event.wheelDeltaY * 0.05;
        // camera.aspect = ;
        // camera.near = ;
        // camera.far = ;
        // camera.updateProjectionMatrix();

    }

    function rotateScene(deltaX, deltaY) {
      console.log('rotatescene')
        // group.rotation.z += deltaX / 100;
        // group.rotation.x += deltaY / 100;
        
        group.children[0].geometry.rotateZ(deltaX / 100);
        group.children[0].geometry.rotateX(deltaY / 100);
        group.children[2].geometry.rotateZ(deltaX / 100);
        group.children[2].geometry.rotateX(deltaY / 100);
    } 

    function cameraMove(deltaX, deltaY) {
      if(mouseRightDown){
        console.log('cameramove')
        camera.position.x -= deltaX / 50;        
        camera.position.z += deltaY / 50;
        lookatP.x -= deltaX / 50;        
        lookatP.z += deltaY / 50;
        camera.lookAt(lookatP.x,lookatP.y,lookatP.z);
      }
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

    var c = document.getElementById("tool_2d");
    c.height = canvas.clientHeight;
    c.width = canvas.clientWidth;
    var ctx = c.getContext("2d");
    ctx.lineWidth = 5;
    ctx.clearRect(0, 0, c.width, c.height);
    if(polygon.length!==0){
      ctx.strokeStyle = document.getElementById("polygoncolor").value;
      ctx.beginPath();
      ctx.moveTo(polygon[0][0], polygon[0][1]);
      for(var i=1;i<polygon.length;i++) ctx.lineTo(polygon[i][0], polygon[i][1]);
      console.log(drawing)
      if(!drawing)ctx.closePath();
      ctx.stroke();
    }
  }

  function animate(){
    ////console.log('animate')
    requestAnimationFrame( animate );
    // controls.update();



    


    // stats.update();
    render();
  }

  function onAddPoint(evt){
    console.log('onaddpoint')
    raycaster.setFromCamera( mouse, camera );
    // raycaster.ray.intersectPlane( plane, pointOnPlane );

    // marker.position.copy( pointOnPlane );
    if(group.children[0]){
      var geometry = group.children[0].geometry;
      
      var index = geometry.index;
      var position = geometry.attributes.position;
      
      var minDistance = Infinity;
      
      for ( let i = 0, l = index.count; i < l; i ++ ) {
      
        var a = index.getX( i );
        // var b = index.getX( i + 1 );
        // var c = index.getX( i + 2 );
        
        pointOnPlane.fromBufferAttribute( position, a )
      //   triangle.a.fromBufferAttribute( position, a );
      //   triangle.b.fromBufferAttribute( position, b );
      //   triangle.c.fromBufferAttribute( position, c );
            
      //   triangle.closestPointToPoint( pointOnPlane, target );

        raycaster.ray.closestPointToPoint(pointOnPlane, target)
        var distanceSq = pointOnPlane.distanceToSquared( target );
        
        if ( distanceSq < minDistance ) {
        
          closestPoint.copy( pointOnPlane );
          minDistance = distanceSq;
        
        }
      
      }
      // ////console.log(closestPoint)
      if(evt.shiftKey){
        selectedPoints[count*3+0] = closestPoint.x;
        selectedPoints[count*3+1] = closestPoint.y;
        selectedPoints[count*3+2] = closestPoint.z;
        count ++;
      }
      else{
        selectedPoints[0] = closestPoint.x;
        selectedPoints[1] = closestPoint.y;
        selectedPoints[2] = closestPoint.z;
        count = 1;
      }
      selectedGroup.geometry.setDrawRange(0, count);
      console.log(count,closestPoint)
      selectedGroup.geometry.attributes.position.needsUpdate = true;
      // marker.position.copy( closestPoint );
      // on first click add an extra point
      
    }
  }

  function drawPolygon(evt){
    if(!drawing){
      polygon = [];
      drawing = true;
    } 
    polygon.push([evt.offsetX,evt.offsetY])

  }

  function drawPencil(evt){
    
    if(mouseDown)
      polygon.push([evt.offsetX,evt.offsetY])
  }

  function startPencil(evt){
    if(!drawing){
      polygon = [];
      console.log('formated')
      drawing = true;
    }
  }

  function isInside(point, vs) {
      var x = point.x,
          y = point.z;

      var inside = false;
      for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
          var xi = vs[i].x,
              yi = vs[i].z;
          var xj = vs[j].x,
              yj = vs[j].z;

          var intersect = ((yi > y) != (yj > y)) &&
              (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
          if (intersect) inside = !inside;
      }

      return inside;
  }

  function asd(){

  }

  function finishdraw(evt){
    console.log('finishing...')
    drawing = false;
    if(polygon.length>2){
      var origin = new THREE.Vector3(parseFloat(camera.position.x),parseFloat(camera.position.y),parseFloat(camera.position.z))
      
      var vs=[];
      for(var i= 0; i<polygon.length;i++){
        var mouse = new THREE.Vector2()
        mouse.x = ( polygon[i][0] / canvas.clientWidth ) * 2 - 1;
        mouse.y = - ( polygon[i][1] / canvas.clientHeight ) * 2 + 1;
        raycaster.setFromCamera( mouse, camera );
        raycaster.ray.intersectPlane( plane, pointOnPlane );
        vs.push({x:pointOnPlane.x,z:pointOnPlane.z})
      }

      var geometry = group.children[0].geometry;
      var index = geometry.index;
      var position = geometry.attributes.position;
      if(!evt.shiftKey) count = 0;
      for ( let i = 0, l = index.count; i < l; i ++ ) {
        var a = index.getX( i );
        var direct = new THREE.Vector3()
        direct.fromBufferAttribute( position, a )
        // var mouse = THREE.Vector2()
        // var ray=new THREE.Ray( new THREE.Vector3().copy(direct),new THREE.Vector3().copy(camera.position).normalize())
        // raycaster.set( new THREE.Vector3().copy(direct),new THREE.Vector3().copy(camera.position));
        raycaster.set( camera.position,new THREE.Vector3().copy(direct).sub( camera.position ).normalize());
        // ray.intersectPlane( plane, pointOnPlane );
        raycaster.ray.intersectPlane( plane, pointOnPlane );
        if(isInside(pointOnPlane, vs)){
          selectedPoints[count*3+0] = direct.x;
          selectedPoints[count*3+1] = direct.y;
          selectedPoints[count*3+2] = direct.z;
          count ++;
        }
      }
 
        selectedGroup.geometry.setDrawRange(0, count);
        console.log(count,closestPoint)
        selectedGroup.geometry.attributes.position.needsUpdate = true;
        // var minDistance = Infinity;

        
        // var b = index.getX( i + 1 );
        // var c = index.getX( i + 2 );
        
        
      //   triangle.a.fromBufferAttribute( position, a );
      //   triangle.b.fromBufferAttribute( position, b );
      //   triangle.c.fromBufferAttribute( position, c );
            
      //   triangle.closestPointToPoint( pointOnPlane, target );

        // raycaster.ray.closestPointToPoint(pointOnPlane, target)
        // var distanceSq = pointOnPlane.distanceToSquared( target );
        
        // if ( distanceSq < minDistance ) {
        
        //   closestPoint.copy( pointOnPlane );
        //   minDistance = distanceSq;
        
        // }
      
      }
      // ////console.log(closestPoint)
      // if(evt.shiftKey){
      //   selectedPoints[count*3+0] = closestPoint.x;
      //   selectedPoints[count*3+1] = closestPoint.y;
      //   selectedPoints[count*3+2] = closestPoint.z;
      //   count ++;
      // }
      // else{
      //   selectedPoints[0] = closestPoint.x;
      //   selectedPoints[1] = closestPoint.y;
      //   selectedPoints[2] = closestPoint.z;
      //   count = 1;
      // }
      // selectedGroup.geometry.setDrawRange(0, count);
      // console.log(count,closestPoint)
      // selectedGroup.geometry.attributes.position.needsUpdate = true;
      // marker.position.copy( closestPoint );
      // on first click add an extra point
      
    }

  function customTriangulate(points3d){
    
  }

  function reloadModelFromData(filename,wholecontent) {
    //////console.log('localdata');
    $('#modelpath').html(filename);
    var lines = wholecontent.split( '\n' );
    getminmaxhegiht(lines);
    var vertices = [];
    var colors = [];
    var points2;
    var points3d = [];
    var values = getminmaxhegiht(lines);
    var min = values[0];
    var max = values[1];

    for ( let line of lines ) {
      line = line.trim();
      if ( line.charAt( 0 ) === '#' ) continue; // skip comments
      var lineValues = line.split( /\s+/ );
      if ( lineValues.length === 3 ) {
      // XYZ
      points3d.push(new THREE.Vector3(parseFloat(lineValues[ 0 ]), parseFloat(lineValues[ 1 ]), parseFloat(lineValues[ 2 ])));
      // vertices.push(parseFloat(lineValues[ 0 ]));
      // vertices.push(parseFloat(lineValues[ 1 ]));
      // vertices.push(parseFloat(lineValues[ 2 ]));
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
    


    var geometry1 = new THREE.BufferGeometry().setFromPoints(points3d);    
    // var geometry1 = new THREE.BufferGeometry();

    // geometry1.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
    if ( colors.length > 0 ) {
      geometry1.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
    }

    // var center = new THREE.Vector3();
    // geometry1.computeBoundingBox();
    // geometry1.boundingBox.getCenter(center);
    geometry1.center();

    // var vertexColors = ( geometry1.hasAttribute( 'color' ) === true );

    var material;
    if(heightmapColor()){
      document.getElementById( 'pointcolor' ).disabled = true;
      material = new THREE.PointsMaterial( { size: 0.1, vertexColors: true, color: "#ffffff" } );
    }
    else
      material = new THREE.PointsMaterial( { size: 0.1, vertexColors: false, color: pointcolor() } );
    // var material = new THREE.PointsMaterial( { size: 0.1, color: pointcolor() } );
    
    while(group.children.length > 0){ 
      group.clear(); 
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
    // points2.position.copy(center);
    
    group.add( points2 );
    
    //Delaunay
    // triangulate x, z
    var indexDelaunay = Delaunator.from(
      points3d.map(v => {
        return [v.x, v.y];
      })
    );
    ////console.log(indexDelaunay);
    var meshIndex = []; // delaunay index => three.js index
    for (let i = 0; i < indexDelaunay.triangles.length; i++){
      meshIndex.push(indexDelaunay.triangles[i]);
    }

    geometry1.setIndex(meshIndex); // add three.js index to the existing geometry
    geometry1.computeVertexNormals();
    var mesh = new THREE.Mesh(
      geometry1, // re-use the existing geometry
      new THREE.MeshLambertMaterial({ color: delaunycolor(), wireframe: true })
    );
    mesh.visible = delauny();
    group.add(mesh);







    selectedPoints = new Float32Array(geometry1.index.count * 30);
    console.log(points3d.length)
    var geometry3 = new THREE.BufferGeometry();
    geometry3.addAttribute('position', new THREE.BufferAttribute(selectedPoints, 3));
    geometry3.setDrawRange(0, 0)
    var material3 = new THREE.PointsMaterial({
      color: selectedcolor(),
      size: selectedsize()
    });
    console.log(material)
    selectedGroup = new THREE.Points(geometry3, material3);
    group.add(selectedGroup);

    // var gui = new dat.GUI();
    // gui.add(mesh.material, "wireframe");
    ////////////
    render();
  }

  function reloadModelFromObjData(filename,wholecontent) {
    //////console.log('localdata');
    $('#modelpath').html(filename);
    
    var geometry1 = new THREE.BufferGeometry();
    var loader = new OBJLoader();
    var points2;
    var colors = [];

    geometry1.copy( loader.parse(wholecontent).children[0].geometry );
    // geometry1.center();


    // var vertexColors = ( geometry1.hasAttribute( 'color' ) === true );
    // var material = new THREE.PointsMaterial( { size: 0.1, vertexColors: vertexColors } );    
    
    var material;
    if(heightmapColor()){
      document.getElementById( 'pointcolor' ).disabled = true;
      material = new THREE.PointsMaterial( { size: 0.1, vertexColors: true, color: "#ffffff" } );
    }
    else
      material = new THREE.PointsMaterial( { size: 0.1, vertexColors: false, color: pointcolor() } );

    
    while(group.children.length > 0){ 
      group.clear(); 
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
    // var geo = loader.parse(wholecontent);
    // ////console.log(geo)
    // geo.children[0].material.wireframe = true;
    group.add( geo );
    var points = geometry1.attributes.position.array;
    var index = -1;
    var dparam = [];
    var values = getminmaxhegihtfromarray(points);
    var min = values[0];
    var max = values[1];
    for(var i=0;i<points.length;i+=3){
      dparam.push( [points[i], points[i+1]] );

      let zvalue = parseFloat( points[ i+2 ] );
      //set rgb from xyz
      let k=(zvalue - min)/(max - min);
      let rgb = getrgb(k);
      //set color from xyz
      colors.push(rgb[0]);
      colors.push(rgb[1]);
      colors.push(rgb[2]);
    }
    if ( colors.length > 0 ) {
      geometry1.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
      material.vertexColors = heightmapColor();
      material.needsUpdate = true;
    }

    //Delaunay
    // triangulate x, z
    var indexDelaunay = Delaunator.from(
      dparam
    );

    var meshIndex = []; // delaunay index => three.js index
    for (let i = 0; i < indexDelaunay.triangles.length; i++){
      meshIndex.push(indexDelaunay.triangles[i]);
    }

    geometry1.setIndex(meshIndex); // add three.js index to the existing geometry
    geometry1.computeVertexNormals();
    var mesh = new THREE.Mesh(
      geometry1, // re-use the existing geometry
      new THREE.MeshLambertMaterial({ color: delaunycolor(), wireframe: true })
    );
    mesh.visible = delauny();
    group.add(mesh);
    render();
  }

  function reloadModelFromJSONData(filename,wholecontent) {
    //////console.log('jsondata');
    // $('#modelpath').html(filename);
    var vertices = [];
    var colors = [];
    var points2;
    var points3d = [];
    var values = getminmaxheightfromjson(wholecontent);
    var min = values[0];
    var max = values[1];

    wholecontent.forEach(function (xyz) {
      points3d.push(new THREE.Vector3(parseFloat(xyz.x), parseFloat(xyz.y), parseFloat(xyz.z)));
      // vertices.push( parseFloat( xyz.x ) );
      // vertices.push( parseFloat( xyz.y ) );
      // vertices.push( parseFloat( xyz.z ) );
      
      let zvalue = parseFloat( xyz.z );
      let k = (zvalue - min)/(max - min);
      let rgb = getrgb(k);
      //set color from xyz
      colors.push(rgb[0]);
      colors.push(rgb[1]);
      colors.push(rgb[2]);
    });
    
    var geometry1 = new THREE.BufferGeometry().setFromPoints(points3d);    
    // var geometry1 = new THREE.BufferGeometry();

    // geometry1.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
    if ( colors.length > 0 ) {
      geometry1.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
    }

    // geometry1.center();

    // var vertexColors = ( geometry1.hasAttribute( 'color' ) === true );
    var material;
    if(heightmapColor()){
      document.getElementById( 'pointcolor' ).disabled = true;
      material = new THREE.PointsMaterial( { size: 0.1, vertexColors: true, color: "#ffffff" } );
    }
    else
      material = new THREE.PointsMaterial( { size: 0.1, vertexColors: false, color: pointcolor() } );
    // var material = new THREE.PointsMaterial( { size: 0.1, color: pointcolor() } );

    
    while(group.children.length > 0){ 
      group.clear(); 
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

    //Delaunay
    // triangulate x, z
    var indexDelaunay = Delaunator.from(
      points3d.map(v => {
        return [v.x, v.y];
      })
    );
    
    var meshIndex = []; // delaunay index => three.js index
    for (let i = 0; i < indexDelaunay.triangles.length; i++){
      meshIndex.push(indexDelaunay.triangles[i]);
    }

    geometry1.setIndex(meshIndex); // add three.js index to the existing geometry
    geometry1.computeVertexNormals();
    var mesh = new THREE.Mesh(
      geometry1, // re-use the existing geometry
      new THREE.MeshLambertMaterial({ color: delaunycolor(), wireframe: true })
    );
    mesh.visible = delauny();
    group.add(mesh);

    // var gui = new dat.GUI();
    // gui.add(mesh.material, "wireframe");
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





//tool control
function selectedcolor(){
  return document.getElementById( 'selectedcolor' ).value;
}
function selectedsize(){
  return document.getElementById( 'vol' ).value;
}
function pointcolor(){
  return document.getElementById( 'pointcolor' ).value;
}
function delaunycolor(){
  return document.getElementById( 'delaunycolor' ).value;
}
function delauny(){
  return document.getElementById('delauny').checked;
}
function heightmapColor(){
  return document.getElementById('heightmapColor').checked;
}

const SelectedSize = document.getElementById( 'vol' );
SelectedSize.addEventListener( 'input', function () {
  setSelectedSize(this.value)
} );

function setSelectedSize(c){
  group.children[2].material.size = c ;
  group.children[2].material.needsUpdate = true;
}

const SelectedColor = document.getElementById( 'selectedcolor' );
SelectedColor.addEventListener( 'input', function () {
  setSelectedColor(this.value)
} );

function setSelectedColor(c){
  group.children[2].material.color.set( c );
}


const Pointcolors = document.getElementById( 'pointcolor' );
Pointcolors.addEventListener( 'input', function () {
  setPointColor(this.value)
} );

function setPointColor(c){
  group.children[0].material.color.set( c );
}


const Delaunycolors = document.getElementById( 'delaunycolor' );
Delaunycolors.addEventListener( 'input', function () {
  setDelaunyColor(this.value)
} );

function setDelaunyColor(c){
  group.children[1].material.color.set( c );
}

document.getElementById('delaunyDiv').addEventListener('click', function(){
  var two = document.getElementById('delauny');
  if(!two.checked){
    
    group.children[1].visible=false;
  }
  else{
   
    group.children[1].visible=true;
  };

});

document.getElementById('heightmapColorDiv').addEventListener('click', function(){
  var two = document.getElementById('heightmapColor');
  if(!two.checked){
  ////console.log(group)
  document.getElementById( 'pointcolor' ).disabled = false;
  setPointColor(pointcolor())
  
    group.children[0].material.vertexColors=false;
    group.children[0].material.needsUpdate = true;
  }
  else{
    ////console.log(group)
     document.getElementById( 'pointcolor' ).disabled = true;
    setPointColor("#ffffff")
    group.children[0].material.vertexColors=true;
    group.children[0].material.needsUpdate = true;
  };

});

function setToolState(tool){
  document.getElementById('btn-'+toolstate).classList.remove('active')
  toolstate = tool;
  document.getElementById('btn-'+toolstate).classList.add('active')
  // console.log({btn:document.getElementById('btn-'+tool)})
}

document.getElementById('btn-move').addEventListener('click', function(){
  polygon = [];
  setToolState('move')
});

document.getElementById('btn-point').addEventListener('click', function(){
  polygon = [];
  setToolState('point')
});

document.getElementById('btn-polygon').addEventListener('click', function(){
  // if(toolstate !== "polygon"){
  //   polygon = []
  // }
  setToolState('polygon')
});

document.getElementById('btn-pencil').addEventListener('click', function(){
  setToolState('pencil')
});