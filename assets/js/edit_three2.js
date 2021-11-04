import * as THREE from './three.module.js';
import { owlStudio } from './owlStudio.js';

const cloudmachine = new owlStudio();



//open file dialog
function btn_open_model() {
  $("#input_model").trigger("click");
}

$('#input_model').change(openModel_Fromlocal);

function openModel_Fromlocal(e) {
  let files = e.target.files;
  if (files.length < 1) {
    alert('select a file...');
    return;
  }
  let file = files[0];

  let reader = new FileReader();
  let model_text;
  reader.addEventListener("load", () => {
    // this will then display a text file
    model_text = reader.result;
    if (file.name.split('.').pop() == 'obj') {
      reloadModelFromObjData(file.name, model_text)
    }
    else {
      reloadModelFromData(file.name, model_text);
    }
  }, false);

  if (file) {
    reader.readAsText(file);
  }
}


let controls, triangle, mouse3, plane, pointOnPlane, target, closestPoint, canvas2;
let camera, count = 0, line, positions, renderer, scene, canvas, parent_canvas, unselectedPoints = [];
let group, raycaster, mouse, toolState = 'move', lookatP = { x: 0, y: 0, z: 0 };
let selectedPoints, selectedGroup, polygon = [], drawing = true;
let mouseDown, mouseRightDown, mouseX, mouseY;
let heapCvalue = 0, averageTop, minTop, maxTop;
let historys = {
  step: 0,
  data: []
}
let sessionHistory = [];
let dblist;
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
  plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  pointOnPlane = new THREE.Vector3();
  target = new THREE.Vector3();
  closestPoint = new THREE.Vector3();


  // const markerGeometry = new THREE.SphereGeometry(0.05);
  // const makerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  // markerGeometry.center();
  // marker = new THREE.Mesh(markerGeometry, makerMaterial);




  //event control
  canvas2.addEventListener('mousemove', function (e) {
    ////console.log('move')

    switch (toolState) {
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
    if (e.button == 0) {
      onMouseDown(e);
      switch (toolState) {
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
    if (e.button == 2) {
      onMouseRightDown(e)
      // switch(toolState) {
      //   case 'move':

      //     break;
      //   case 'point':
      //     onAddPoint(e)
      //     break;
      //   case 'polygon':
      //     drawPolygon(e)
      //     break;
      //   case 'pencil':
      //     startPencil(e)
      //     break;
      //   default:
      //     // code block
      // }
    }

  }, false);

  canvas2.addEventListener('mouseup', function (e) {
    console.log('up')
    if (e.button == 0) {
      onMouseUp(e);
      switch (toolState) {
        case 'pencil':
          finishdraw(e)
          break;
      }
    }
    else if (e.button == 2) {
      onMouseRightUp(e)
    }

  }, false);

  canvas2.addEventListener('click', function (e) {
    ////console.log('click')
    onMouseMove(e);
  }, false);

  canvas2.addEventListener('dblclick', function (e) {
    ////console.log('dblclick')
    switch (toolState) {
      case 'polygon':
        finishdraw(e)
        break;

    }
  }, false);

  canvas2.addEventListener('contextmenu', (e) => {
    // e.preventDefault();
    ////console.log('rightclick')
    console.log('Success');
    if (e.button == 2) {
      console.log('rightclicked')
      onMouseRightUp(e)
    }
  }, false);

  canvas2.addEventListener('mousewheel', (e) => {
    if (toolState === 'move')
      onDocumentMouseWheel(e);
  }, false);


  //render, scene
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  scene = new THREE.Scene();
  //scene background color
  scene.background = new THREE.Color(0x111111);


  let light = new THREE.DirectionalLight(0xffffff, 1.5);
  // light.position.setScalar(100);
  light.position.set(0, 0, 56);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));


  let fov = 60;
  let aspect = canvas.clientWidth / canvas.clientHeight;  // the canvas default
  let near = 0.01;
  let far = 1000;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, -20, 6);
  // camera.position.setScalar(15);
  camera.lookAt(0, 0, 0);
  scene.add(camera);

  //natural rotate control
  controls = new OrbitControls(camera, renderer.domElement);
  controls.addEventListener('change', render); // call this only in static scenes (i.e., if there is no animation loop)
  controls.minDistance = 0.1;
  controls.maxDistance = 100;
  // controls.enableRotate = true;
  controls.maxPolarAngle = Infinity;
  controls.enableRotate = false;
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
  // let loader = new PCDLoader();
  // loader.load( '../3dmodels/Zaghetto.pcd', function ( points ) {

  // points.geometry.center();
  // points.geometry.rotateX( Math.PI );
  // scene.add( points );

  // render();

  // } );
  group = new THREE.Object3D();
  let points1, pointcloud;
  const loader = new THREE.FileLoader();
  let tempvaluetag = document.getElementById('pointcloud');
  if (tempvaluetag) {
    pointcloud = tempvaluetag.value;
    pointcloud = JSON.parse(pointcloud);
    let modelname = 'new_Model';
    reloadModelFromJSONData(modelname, pointcloud);
  } else {
    loader.load('./3dmodels/Weissspat_1632872292.txt', function (text) {
      // $('#modelpath').html('Weissspat_1632872292.txt');
      reloadModelFromData('Weissspat_1632872292.txt', text);
    });
  }
  scene.add(group);

  parent_canvas = document.getElementById('main_canvas');
  $('#btn-openfromLocal').click(function () {
    btn_open_model();
  })

  // resize canvas when Toggle fullscreen
  $('a[data-action="expand"]').on('click', async function (e) {
    await new Promise(r => setTimeout(r, 10));
    onWindowResize();
  });
  window.addEventListener('resize', onWindowResize);





  //drag and drop
  // While dragging the p element, change the color of the output text
  document.addEventListener("drag", function (event) {
    document.getElementById("viewer_3d").style.color = "red";
  });

  // Output some text when finished dragging the p element and reset the opacity
  document.addEventListener("dragend", function (event) {
    document.getElementById("viewer_3d").innerHTML = "Finished dragging the p element.";
    canvas.style.opacity = "1";
  });

  /* Events fired on the drop target */

  // When the draggable p element enters the droptarget, change the DIVS's border style
  document.addEventListener("dragenter", function (event) {
    if (event.target.className == "dviewer") {
      canvas.style.border = "3px dotted red";
    }
  });

  // By default, data/elements cannot be dropped in other elements. To allow a drop, we must prevent the default handling of the element
  document.addEventListener("dragover", function (event) {
    // console.log('dragover')
    event.preventDefault();
    // document.getElementById("viewer_3d").style.color = "red";
  });

  // When the draggable p element leaves the droptarget, reset the DIVS's border style
  document.addEventListener("dragleave", function (event) {
    // console.log('dragover')
    if (event.target.className == "dviewer") {
      canvas.style.border = "";
    }
  });

  /* On drop - Prevent the browser default handling of the data (default is open as link on drop)
    Reset the color of the output text and DIV's border color
    Get the dragged data with the dataTransfer.getData() method
    The dragged data is the id of the dragged element ("drag1")
    Append the dragged element into the drop element
  */
  document.addEventListener("drop", function (event) {
    event.preventDefault();
    if (event.target.className == "dviewer") {
      document.getElementById("viewer_3d").style.color = "";
      canvas.style.border = "";
      let file = event.dataTransfer.files[0];
      let reader = new FileReader();
      reader.onload = function (ev) {
        let model_text = ev.target.result;
        if (file.name.split('.').pop() == 'obj') {
          reloadModelFromObjData(file.name, model_text)
        }
        else {
          reloadModelFromData(file.name, model_text);
        }
      };

      reader.readAsText(file);
    }
  });


  function updateLine() {
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, pointOnPlane);
    positions[count * 3 - 3] = pointOnPlane.x;
    positions[count * 3 - 2] = pointOnPlane.y;
    positions[count * 3 - 1] = pointOnPlane.z;
    line.geometry.attributes.position.needsUpdate = true;
  }

  function addPoint(event) {
    //console.log("point nr " + count + ": " + mouse.x + " " + mouse.y + " " + mouse.z);
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, pointOnPlane);
    positions.push(parseFloat(pointOnPlane.x), parseFloat(pointOnPlane.y), parseFloat(pointOnPlane.z))
    count++;
    line.geometry.setDrawRange(0, count);
    updateLine();
  }

  function onMouseMove(evt) {
    evt.preventDefault();

    if (mouseDown) {
      console.log('mousedownmove')
      let deltaX = evt.clientX - mouseX,
        deltaY = evt.clientY - mouseY;
      mouseX = evt.clientX;
      mouseY = evt.clientY;
      rotateScene(deltaX, deltaY);
    }
    else if (mouseRightDown) {
      console.log('mouserightdown')
      let deltaX = evt.clientX - mouseX,
        deltaY = evt.clientY - mouseY;
      mouseX = evt.clientX;
      mouseY = evt.clientY;
      cameraMove(deltaX, deltaY)
    }

  }

  function onDocumentMouseMove(event) {
    console.log('ondocumentmousemove')
    mouse.x = (event.offsetX / canvas.clientWidth) * 2 - 1;
    mouse.y = - (event.offsetY / canvas.clientHeight) * 2 + 1;
  }

  function onMouseDown(evt) {
    console.log('onmousedown')
    evt.preventDefault();

    mouseDown = true;
    mouseX = evt.clientX;
    mouseY = evt.clientY;
    // render()

  }

  function onMouseUp(evt) {
    console.log('onmouseup')
    evt.preventDefault();

    mouseDown = false;
    // render()
  }

  function onMouseRightDown(evt) {
    evt.preventDefault();
    console.log('down')
    mouseRightDown = true;
    mouseX = evt.clientX;
    mouseY = evt.clientY;
    // render()
  }

  function onMouseRightUp(evt) {
    evt.preventDefault();
    console.log('down')
    mouseRightDown = false;
    // render()
  }

  function onDocumentMouseWheel(event) {
    console.log('ondocumentmousewheel')
    event.preventDefault();
    camera.position.y -= event.deltaY / 100;
    camera.position.z += event.deltaY / 100 * 3 / 10;
    lookatP.y -= event.deltaY / 100;
    lookatP.z += event.deltaY / 100 * 3 / 10;

    camera.lookAt(lookatP.x, lookatP.y, lookatP.z);
    render()

  }

  function rotateScene(deltaX, deltaY) {
    console.log('rotatescene')
    group.rotation.z += deltaX / 100;
    group.rotation.x += deltaY / 100;

    // group.children[0].geometry.rotateZ(deltaX / 100);
    // group.children[0].geometry.rotateX(deltaY / 100);
    // group.children[2].geometry.rotateZ(deltaX / 100);
    // group.children[2].geometry.rotateX(deltaY / 100);
    render()
  }

  function cameraMove(deltaX, deltaY) {
    if (mouseRightDown) {
      console.log('cameramove')
      camera.position.x -= deltaX / 50;
      camera.position.z += deltaY / 50;
      lookatP.x -= deltaX / 50;
      lookatP.z += deltaY / 50;
      camera.lookAt(lookatP.x, lookatP.y, lookatP.z);
      render()
    }
  }
}

function onWindowResize() {
  polygon = [];
  camera.aspect = parent_canvas.clientWidth / parent_canvas.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize((parent_canvas.clientWidth - 30), parent_canvas.clientHeight);
  render()
  polygonRender()
  // controls.handleResize();
}

function render() {
  renderer.render(scene, camera);
}

function polygonRender() {
  let c = document.getElementById("tool_2d");
  c.height = canvas.clientHeight;
  c.width = canvas.clientWidth;
  let ctx = c.getContext("2d");
  ctx.lineWidth = 5;
  ctx.clearRect(0, 0, c.width, c.height);
  if (polygon.length !== 0) {
    ctx.strokeStyle = document.getElementById("polygoncolor").value;
    ctx.beginPath();
    ctx.moveTo(polygon[0][0], polygon[0][1]);
    for (let i = 1; i < polygon.length; i++) ctx.lineTo(polygon[i][0], polygon[i][1]);
    console.log(drawing)
    if (!drawing) ctx.closePath();
    ctx.stroke();
  }
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function onAddPoint(evt) {
  console.log('onaddpoint')
  raycaster.setFromCamera(mouse, camera);

  if (group.children[0]) {
    if (evt.ctrlKey && count > 0) {
      let geometry = selectedGroup.geometry;

      let position = geometry.attributes.position;

      let minDistance = Infinity;
      let dind = 0;
      let lop = count;
      count = 0;
      for (let i = 0; i < lop; i++) {

        pointOnPlane.copy(new THREE.Vector3(position.array[i * 3], position.array[i * 3 + 1], position.array[i * 3 + 2]))

        raycaster.ray.closestPointToPoint(new THREE.Vector3().copy(pointOnPlane).applyEuler(group.rotation), target)
        let distanceSq = new THREE.Vector3().copy(pointOnPlane).applyEuler(group.rotation).distanceToSquared(target);

        if (distanceSq < minDistance) {

          minDistance = distanceSq;
          dind = i;
        }

      }

      let newpoints = [...selectedPoints];
      for (let i = 0; i < lop; i++) {
        if (i !== dind) {
          selectedPoints[count * 3 + 0] = newpoints[i * 3];
          selectedPoints[count * 3 + 1] = newpoints[i * 3 + 1];
          selectedPoints[count * 3 + 2] = newpoints[i * 3 + 2];
          count++;
        }
        else {
          unselectedPoints.push(newpoints[i * 3], newpoints[i * 3 + 1], newpoints[i * 3 + 2])
        }
      }

      selectedGroup.geometry.setDrawRange(0, count);
      console.log(count, closestPoint)
      selectedGroup.geometry.attributes.position.needsUpdate = true;

    }
    else if (evt.shiftKey) {
      // let geometry = group.children[0].geometry;

      // let index = geometry.index;
      // let position = geometry.attributes.position;

      let minDistance = Infinity;
      let sind;
      console.log(unselectedPoints.length)
      for (let i = 0; i < unselectedPoints.length; i += 3) {

        // let a = index.getX(i);

        // pointOnPlane.fromBufferAttribute(position, a)

        raycaster.ray.closestPointToPoint(new THREE.Vector3(unselectedPoints[i], unselectedPoints[i + 1], unselectedPoints[i + 2]).applyEuler(group.rotation), target)
        let distanceSq = new THREE.Vector3(unselectedPoints[i], unselectedPoints[i + 1], unselectedPoints[i + 2]).applyEuler(group.rotation).distanceToSquared(target);

        if (distanceSq < minDistance) {

          closestPoint.set(unselectedPoints[i], unselectedPoints[i + 1], unselectedPoints[i + 2]);
          minDistance = distanceSq;
          sind = i;
        }

      }
      // ////console.log(closestPoint)
      let unclonep = [...unselectedPoints];
      unselectedPoints = [];
      for (let i = 0; i < unclonep.length; i += 3) {
        if (i != sind) unselectedPoints.push(unclonep[i], unclonep[i + 1], unclonep[i + 2])
      }


      selectedPoints[count * 3 + 0] = closestPoint.x;
      selectedPoints[count * 3 + 1] = closestPoint.y;
      selectedPoints[count * 3 + 2] = closestPoint.z;
      count++;

      selectedGroup.geometry.setDrawRange(0, count);
      console.log(count, closestPoint)
      selectedGroup.geometry.attributes.position.needsUpdate = true;
      // marker.position.copy( closestPoint );
      // on first click add an extra point
    }
    else {
      // let geometry = group.children[0].geometry;
      let array = group.children[0].geometry.attributes.position.array;
      // let index = geometry.index;
      // let position = geometry.attributes.position;

      let minDistance = Infinity;
      let sind;
      for (let i = 0; i < array.length; i += 3) {

        // let a = index.getX(i);

        // pointOnPlane.fromBufferAttribute(position, a)

        raycaster.ray.closestPointToPoint(new THREE.Vector3(array[i], array[i + 1], array[i + 2]).applyEuler(group.rotation), target)
        let distanceSq = new THREE.Vector3(array[i], array[i + 1], array[i + 2]).applyEuler(group.rotation).distanceToSquared(target);

        if (distanceSq < minDistance) {

          closestPoint.set(array[i], array[i + 1], array[i + 2]);
          minDistance = distanceSq;
          sind = i;
        }

      }
      // sind *= 3;
      // ////console.log(closestPoint)
      let unclonep = [];
      for (let i = 0; i < array.length; i += 3) {
        // let a = index.getX(i);
        // pointOnPlane.fromBufferAttribute(position, a)
        if (i != sind) unclonep.push(array[i], array[i + 1], array[i + 2])
      }
      unselectedPoints = unclonep;

      selectedPoints[0] = closestPoint.x;
      selectedPoints[1] = closestPoint.y;
      selectedPoints[2] = closestPoint.z;
      count = 1;

      selectedGroup.geometry.setDrawRange(0, count);
      console.log(count, closestPoint)
      selectedGroup.geometry.attributes.position.needsUpdate = true;
      // marker.position.copy( closestPoint );
      // on first click add an extra point
    }


  }
  render()
}

function drawPolygon(evt) {
  if (!drawing) {
    polygon = [];
    drawing = true;
  }
  polygon.push([evt.offsetX, evt.offsetY])
  polygonRender()
}

function drawPencil(evt) {

  if (mouseDown)
    polygon.push([evt.offsetX, evt.offsetY])
  polygonRender()
}

function startPencil(evt) {
  if (!drawing) {
    polygon = [];
    console.log('formated')
    drawing = true;
  }
  polygonRender()
}

function isInside(point, vs) {
  let x = point.x,
    y = point.z;

  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i].x,
      yi = vs[i].z;
    let xj = vs[j].x,
      yj = vs[j].z;

    let intersect = ((yi > y) != (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}

function asd() {

}

function finishdraw(evt) {
  console.log('finishing...')
  drawing = false;
  if (polygon.length > 2) {
    let origin = new THREE.Vector3(parseFloat(camera.position.x), parseFloat(camera.position.y), parseFloat(camera.position.z))

    let vs = [];
    for (let i = 0; i < polygon.length; i++) {
      let mouse = new THREE.Vector2()
      mouse.x = (polygon[i][0] / canvas.clientWidth) * 2 - 1;
      mouse.y = - (polygon[i][1] / canvas.clientHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      raycaster.ray.intersectPlane(plane, pointOnPlane);
      vs.push({ x: pointOnPlane.x, z: pointOnPlane.z })
    }


    if (evt.ctrlKey && count > 0) {
      let geometry = selectedGroup.geometry;
      let index = geometry.index;
      let position = geometry.attributes.position;
      let lop = count;
      count = 0;
      for (let i = 0; i < lop; i++) {

        let direct = new THREE.Vector3(position.array[i * 3], position.array[i * 3 + 1], position.array[i * 3 + 2])

        raycaster.set(camera.position, new THREE.Vector3().copy(direct).applyEuler(group.rotation).sub(camera.position).normalize());

        raycaster.ray.intersectPlane(plane, pointOnPlane);
        if (!isInside(pointOnPlane, vs)) {
          selectedPoints[count * 3 + 0] = direct.x;
          selectedPoints[count * 3 + 1] = direct.y;
          selectedPoints[count * 3 + 2] = direct.z;
          count++;
        }
        else {
          unselectedPoints.push(direct.x, direct.y, direct.z)
        }
      }
    }
    else if (evt.shiftKey) {

      // let geometry = group.children[0].geometry;
      // let index = geometry.index;
      // let position = geometry.attributes.position;
      let updatedUn = [];
      for (let i = 0; i < unselectedPoints.length; i += 3) {
        // let a = index.getX(i);
        let direct = new THREE.Vector3(unselectedPoints[i], unselectedPoints[i + 1], unselectedPoints[i + 2])
        // direct.fromBufferAttribute(position, a)

        raycaster.set(camera.position, new THREE.Vector3().copy(direct).applyEuler(group.rotation).sub(camera.position).normalize());

        raycaster.ray.intersectPlane(plane, pointOnPlane);
        if (isInside(pointOnPlane, vs)) {
          selectedPoints[count * 3 + 0] = direct.x;
          selectedPoints[count * 3 + 1] = direct.y;
          selectedPoints[count * 3 + 2] = direct.z;
          count++;
        }
        else {
          updatedUn.push(direct.x, direct.y, direct.z)
        }
      }
      unselectedPoints = updatedUn;
    }
    else {
      count = 0;
      let geometry = group.children[0].geometry;
      let index = geometry.index;
      let position = geometry.attributes.position;
      unselectedPoints = [];
      for (let i = 0, l = index.count; i < l; i++) {
        let a = index.getX(i);
        let direct = new THREE.Vector3()
        direct.fromBufferAttribute(position, a)

        raycaster.set(camera.position, new THREE.Vector3().copy(direct).applyEuler(group.rotation).sub(camera.position).normalize());

        raycaster.ray.intersectPlane(plane, pointOnPlane);

        if (isInside(pointOnPlane, vs)) {
          selectedPoints[count * 3 + 0] = direct.x;
          selectedPoints[count * 3 + 1] = direct.y;
          selectedPoints[count * 3 + 2] = direct.z;
          count++;
        }
        else {
          unselectedPoints.push(direct.x, direct.y, direct.z)
        }
      }
    }

    selectedGroup.geometry.setDrawRange(0, count);
    console.log(count, closestPoint)
    selectedGroup.geometry.attributes.position.needsUpdate = true;

    render()
    polygonRender()
  }
}

function customTriangulate(points3d) {

}

function reloadGroundFromData(filename, content) {
  // $('#groundpath').html(filename);
  let lines = content.split('\n');
  groundTop = 0;
  maxTop = -Infinity;
  minTop = Infinity;
  averageTop = 0;
  let count = 0;
  let saveArray = [];
  let points3d = [];
  for (let line of lines) {
    line = line.trim();
    if (line.charAt(0) === '#') continue; // skip comments
    let lineValues = line.split(/\s+/);
    if (lineValues.length === 3) {
      points3d.push(new THREE.Vector3(parseFloat(lineValues[0]), parseFloat(lineValues[1]), parseFloat(lineValues[2])));
      saveArray.push(parseFloat(lineValues[0]), parseFloat(lineValues[1]), parseFloat(lineValues[2]));
      averageTop += parseFloat(lineValues[2]);
      count++;
      if (maxTop < lineValues[2]) maxTop = lineValues[2];
      if (minTop > lineValues[2]) minTop = lineValues[2];
    }
  }
  averageTop /= count;
  console.log(count)
  let geometry1 = new THREE.BufferGeometry().setFromPoints(points3d);
  groundTop = geometry1.attributes.position.array[2];
  sessionHistory.push({
    name: filename,
    date: getDate(),
    time: getTime(),
    type: 'ground',
    data: saveArray,
  })
  geometry1.center();
  groundTop -= geometry1.attributes.position.array[2];
  // alert(groundTop)
}

function reloadModelFromData(filename, wholecontent) {
  historys.step = 0;
  historys.data = [];
  $('#modelpath').html(filename);
  let lines = wholecontent.split('\n');
  getminmaxhegiht(lines);
  let vertices = [];
  let colors = [];
  let points2;
  let points3d = [];
  let values = getminmaxhegiht(lines);
  let min = values[0];
  let max = values[1];
  let saveArray = [];
  for (let line of lines) {
    line = line.trim();
    if (line.charAt(0) === '#') continue; // skip comments
    let lineValues = line.split(/\s+/);
    if (lineValues.length === 3) {
      // XYZ
      points3d.push(new THREE.Vector3(parseFloat(lineValues[0]), parseFloat(lineValues[1]), parseFloat(lineValues[2])));
      saveArray.push(parseFloat(lineValues[0]), parseFloat(lineValues[1]), parseFloat(lineValues[2]));
      let zvalue = parseFloat(lineValues[2]);
      //set rgb from xyz
      let k = (zvalue - min) / (max - min);
      let rgb = getrgb(k);
      //set color from xyz
      colors.push(rgb[0]);
      colors.push(rgb[1]);
      colors.push(rgb[2]);
    }
  }


  let geometry1 = new THREE.BufferGeometry().setFromPoints(points3d);
  sessionHistory.push({
    name: filename,
    date: getDate(),
    time: getTime(),
    type: 'model(txt)',
    data: saveArray,
  })
  if (colors.length > 0) {
    geometry1.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  }

  // console.log(geometry1.attributes.position.array)
  heapCvalue = geometry1.attributes.position.array[2];
  geometry1.center();
  heapCvalue -= geometry1.attributes.position.array[2];
  // console.log(geometry1.attributes.position.array)

  // let vertexColors = ( geometry1.hasAttribute( 'color' ) === true );

  let material;
  if (heightmapColor()) {
    document.getElementById('pointcolor').disabled = true;
    material = new THREE.PointsMaterial({ size: 0.1, vertexColors: true, color: "#ffffff" });
  }
  else
    material = new THREE.PointsMaterial({ size: 0.1, vertexColors: false, color: pointcolor() });
  // let material = new THREE.PointsMaterial( { size: 0.1, color: pointcolor() } );

  while (group.children.length > 0) {
    group.clear();
  }


  points2 = new THREE.Points(geometry1, material);
  // points2.position.copy(center);

  group.add(points2);

  //Delaunay
  // triangulate x, z
  let indexDelaunay = Delaunator.from(
    points3d.map(v => {
      return [v.x, v.y];
    })
  );
  ////console.log(indexDelaunay);
  let meshIndex = []; // delaunay index => three.js index
  for (let i = 0; i < indexDelaunay.triangles.length; i++) {
    meshIndex.push(indexDelaunay.triangles[i]);
  }

  geometry1.setIndex(meshIndex); // add three.js index to the existing geometry
  geometry1.computeVertexNormals();

  // let geometry5 = new ConvexGeometry(points3d);
  // geometry5.computeBoundingSphere();
  // geometry5.center()

  let mesh = new THREE.Mesh(
    geometry1, // re-use the existing geometry
    new THREE.MeshLambertMaterial({ color: heightmapColor() ? "#ffffff" : pointcolor(), wireframe: surface(), side: THREE.DoubleSide, vertexColors: heightmapColor(), })
  );
  mesh.visible = delauny();
  group.add(mesh);



  unselectedPoints = [...geometry1.attributes.position.array];
  selectedPoints = new Float32Array(geometry1.index.count * 30);
  // console.log(points3d.length)
  let geometry3 = new THREE.BufferGeometry();
  geometry3.addAttribute('position', new THREE.BufferAttribute(selectedPoints, 3));
  geometry3.setDrawRange(0, 0)
  let material3 = new THREE.PointsMaterial({
    color: selectedcolor(),
    size: selectedsize()
  });

  selectedGroup = new THREE.Points(geometry3, material3);
  group.add(selectedGroup);

  // let gui = new dat.GUI();
  // gui.add(mesh.material, "wireframe");
  ////////////convex testing
  let geometry5 = new ConvexGeometry(points3d);
  // geometry5.setIndex(meshIndex);
  geometry5.computeBoundingSphere();
  // if (colors.length > 0) {
  //   geometry5.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  // }
  geometry5.center()
  let mesh5 = new THREE.Mesh(
    geometry5,
    new THREE.MeshLambertMaterial({ color: delaunycolor(), wireframe: surface(), side: THREE.DoubleSide, })
  );
  mesh5.visible = delauny3();
  group.add(mesh5);
  //////////////////convex testing

  console.log(group)
  render();
}

function reloadModelFromObjData(filename, wholecontent) {
  //////console.log('localdata');
  historys.step = 0;
  historys.data = [];
  $('#modelpath').html(filename);

  let geometry1 = new THREE.BufferGeometry();
  let loader = new OBJLoader();
  let points2;
  let points3d = [];
  let colors = [];

  geometry1.copy(loader.parse(wholecontent).children[0].geometry);
  sessionHistory.push({
    name: filename,
    date: getDate(),
    time: getTime(),
    type: 'model(obj)',
    data: [...geometry1.attributes.position.array],
  })
  heapCvalue = geometry1.attributes.position.array[2];
  geometry1.center();
  heapCvalue -= geometry1.attributes.position.array[2];


  // let vertexColors = ( geometry1.hasAttribute( 'color' ) === true );
  // let material = new THREE.PointsMaterial( { size: 0.1, vertexColors: vertexColors } );    

  let material;
  if (heightmapColor()) {
    document.getElementById('pointcolor').disabled = true;
    material = new THREE.PointsMaterial({ size: 0.1, vertexColors: true, color: "#ffffff" });
  }
  else
    material = new THREE.PointsMaterial({ size: 0.1, vertexColors: false, color: pointcolor() });


  while (group.children.length > 0) {
    group.clear();
  }

  points2 = new THREE.Points(geometry1, material);
  group.add(points2);

  let points = geometry1.attributes.position.array;
  let index = -1;
  let dparam = [];
  let values = getminmaxhegihtfromarray(points);
  let min = values[0];
  let max = values[1];
  for (let i = 0; i < points.length; i += 3) {
    points3d.push(new THREE.Vector3(points[i], points[i + 1], points[i + 2]))
    dparam.push([points[i], points[i + 1]]);

    let zvalue = parseFloat(points[i + 2]);
    //set rgb from xyz
    let k = (zvalue - min) / (max - min);
    let rgb = getrgb(k);
    //set color from xyz
    colors.push(rgb[0]);
    colors.push(rgb[1]);
    colors.push(rgb[2]);
  }
  if (colors.length > 0) {
    geometry1.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    material.vertexColors = heightmapColor();
    material.needsUpdate = true;
  }

  //Delaunay
  // triangulate x, z
  let indexDelaunay = Delaunator.from(
    dparam
  );

  let meshIndex = []; // delaunay index => three.js index
  for (let i = 0; i < indexDelaunay.triangles.length; i++) {
    meshIndex.push(indexDelaunay.triangles[i]);
  }

  geometry1.setIndex(meshIndex); // add three.js index to the existing geometry
  geometry1.computeVertexNormals();
  let mesh = new THREE.Mesh(
    geometry1, // re-use the existing geometry
    new THREE.MeshLambertMaterial({ color: heightmapColor() ? "#ffffff" : pointcolor(), wireframe: surface(), side: THREE.DoubleSide, vertexColors: heightmapColor(), })
  );
  mesh.visible = delauny();
  group.add(mesh);




  unselectedPoints = [...geometry1.attributes.position.array];
  selectedPoints = new Float32Array(geometry1.index.count * 30);
  // console.log(points3d.length)
  let geometry3 = new THREE.BufferGeometry();
  geometry3.addAttribute('position', new THREE.BufferAttribute(selectedPoints, 3));
  geometry3.setDrawRange(0, 0)
  let material3 = new THREE.PointsMaterial({
    color: selectedcolor(),
    size: selectedsize()
  });
  console.log(material)
  selectedGroup = new THREE.Points(geometry3, material3);
  group.add(selectedGroup);


  ////////////convex testing
  let geometry5 = new ConvexGeometry(points3d);
  geometry5.computeBoundingSphere();
  geometry5.center()
  let mesh5 = new THREE.Mesh(
    geometry5,
    new THREE.MeshLambertMaterial({ color: delaunycolor(), wireframe: surface(), side: THREE.DoubleSide })
  );
  mesh5.visible = delauny3();
  group.add(mesh5);
  //////////////////convex testing
  render();
}

function reloadModelFromJSONData(filename, wholecontent) {
  $('#modelpath').html(filename);
  historys.step = 0;
  historys.data = [];
  let colors = [];
  let points2;
  let points3d = [];
  let values = getminmaxheightfromjson(wholecontent);
  let min = values[0];
  let max = values[1];
  let saveArray = [];
  wholecontent.forEach(function (xyz) {
    points3d.push(new THREE.Vector3(parseFloat(xyz.x), parseFloat(xyz.y), parseFloat(xyz.z)));
    saveArray.push(parseFloat(xyz.x), parseFloat(xyz.y), parseFloat(xyz.z));
    let zvalue = parseFloat(xyz.z);
    let k = (zvalue - min) / (max - min);
    let rgb = getrgb(k);
    //set color from xyz
    colors.push(rgb[0]);
    colors.push(rgb[1]);
    colors.push(rgb[2]);
  });

  let geometry1 = new THREE.BufferGeometry().setFromPoints(points3d);
  sessionHistory.push({
    name: filename,
    date: getDate(),
    time: getTime(),
    type: 'model(json)',
    data: saveArray,
  })
  if (colors.length > 0) {
    geometry1.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  }

  heapCvalue = geometry1.attributes.position.array[2];
  geometry1.center();
  heapCvalue -= geometry1.attributes.position.array[2];

  let material;
  if (heightmapColor()) {
    document.getElementById('pointcolor').disabled = true;
    material = new THREE.PointsMaterial({ size: 0.1, vertexColors: true, color: "#ffffff" });
  }
  else
    material = new THREE.PointsMaterial({ size: 0.1, vertexColors: false, color: pointcolor() });

  while (group.children.length > 0) {
    group.clear();
  }



  points2 = new THREE.Points(geometry1, material);
  group.add(points2);

  //Delaunay
  // triangulate x, z
  let indexDelaunay = Delaunator.from(
    points3d.map(v => {
      return [v.x, v.y];
    })
  );

  let meshIndex = []; // delaunay index => three.js index
  for (let i = 0; i < indexDelaunay.triangles.length; i++) {
    meshIndex.push(indexDelaunay.triangles[i]);
  }

  geometry1.setIndex(meshIndex); // add three.js index to the existing geometry
  geometry1.computeVertexNormals();
  let mesh = new THREE.Mesh(
    geometry1, // re-use the existing geometry
    new THREE.MeshLambertMaterial({ color: heightmapColor() ? "#ffffff" : pointcolor(), wireframe: surface(), side: THREE.DoubleSide, vertexColors: heightmapColor(), })
  );
  mesh.visible = delauny();
  group.add(mesh);


  unselectedPoints = [...geometry1.attributes.position.array];
  selectedPoints = new Float32Array(geometry1.index.count * 30);
  console.log(points3d.length)
  let geometry3 = new THREE.BufferGeometry();
  geometry3.addAttribute('position', new THREE.BufferAttribute(selectedPoints, 3));
  geometry3.setDrawRange(0, 0)
  let material3 = new THREE.PointsMaterial({
    color: selectedcolor(),
    size: selectedsize()
  });
  console.log(material)
  selectedGroup = new THREE.Points(geometry3, material3);
  group.add(selectedGroup);


  ////////////convex testing
  let geometry5 = new ConvexGeometry(points3d);
  geometry5.computeBoundingSphere();
  geometry5.center()
  let mesh5 = new THREE.Mesh(
    geometry5,
    new THREE.MeshLambertMaterial({ color: delaunycolor(), wireframe: surface(), side: THREE.DoubleSide })
  );
  mesh5.visible = delauny3();
  group.add(mesh5);
  //////////////////convex testing
  console.log('rendered')
  // render();
  setTimeout(() => { render() }, 2000)
}

function reloadModelFromArray(array, neededhistory = false, needsaveheap = false) {
  if (neededhistory == true) {
    let clone = [];
    for (let i = 0; i < array.length; i++) {
      clone.push(array[i] + heapCvalue)
    }
    sessionHistory.push({
      name: document.getElementById('modelpath').innerText,
      date: getDate(),
      time: getTime(),
      type: 'model(edited)',
      data: clone,
    })
  }
  else if (neededhistory == "withoutheap") {
    let clone = [...array];
    sessionHistory.push({
      name: document.getElementById('modelpath').innerText,
      date: getDate(),
      time: getTime(),
      type: 'model(edited)',
      data: clone,
    })
  }
  let colors = [];
  let points2;
  let points3d = [];
  let values = getminmaxhegihtfromarray(array);
  let min = values[0];
  let max = values[1];

  for (let i = 0; i < array.length; i += 3) {
    points3d.push(new THREE.Vector3(parseFloat(array[i]), parseFloat(array[i + 1]), parseFloat(array[i + 2])));

    let zvalue = parseFloat(array[i + 2]);
    let k = (zvalue - min) / (max - min);
    let rgb = getrgb(k);
    //set color from xyz
    colors.push(rgb[0]);
    colors.push(rgb[1]);
    colors.push(rgb[2]);
  }

  let geometry1 = new THREE.BufferGeometry().setFromPoints(points3d);

  if (colors.length > 0) {
    geometry1.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  }
  if (needsaveheap) {
    heapCvalue = geometry1.attributes.position.array[2];
    geometry1.center();
    heapCvalue -= geometry1.attributes.position.array[2];
  }
  // geometry1.center();

  let material;
  if (heightmapColor()) {
    document.getElementById('pointcolor').disabled = true;
    material = new THREE.PointsMaterial({ size: 0.1, vertexColors: true, color: "#ffffff" });
  }
  else
    material = new THREE.PointsMaterial({ size: 0.1, vertexColors: false, color: pointcolor() });

  while (group.children.length > 0) {
    group.clear();
  }



  points2 = new THREE.Points(geometry1, material);
  group.add(points2);

  //Delaunay
  // triangulate x, z
  let indexDelaunay = Delaunator.from(
    points3d.map(v => {
      return [v.x, v.y];
    })
  );

  let meshIndex = []; // delaunay index => three.js index
  for (let i = 0; i < indexDelaunay.triangles.length; i++) {
    meshIndex.push(indexDelaunay.triangles[i]);
  }

  geometry1.setIndex(meshIndex); // add three.js index to the existing geometry
  geometry1.computeVertexNormals();
  let mesh = new THREE.Mesh(
    geometry1, // re-use the existing geometry
    new THREE.MeshLambertMaterial({ color: heightmapColor() ? "#ffffff" : pointcolor(), wireframe: surface(), side: THREE.DoubleSide, vertexColors: heightmapColor(), })
  );
  mesh.visible = delauny();
  group.add(mesh);


  unselectedPoints = [...geometry1.attributes.position.array];
  selectedPoints = new Float32Array(geometry1.index.count * 30);
  console.log(points3d.length)
  let geometry3 = new THREE.BufferGeometry();
  geometry3.addAttribute('position', new THREE.BufferAttribute(selectedPoints, 3));
  geometry3.setDrawRange(0, 0)
  let material3 = new THREE.PointsMaterial({
    color: selectedcolor(),
    size: selectedsize()
  });
  console.log(material)
  selectedGroup = new THREE.Points(geometry3, material3);
  group.add(selectedGroup);



  ////////////convex testing
  let geometry5 = new ConvexGeometry(points3d);
  geometry5.computeBoundingSphere();
  // geometry5.center()
  let mesh5 = new THREE.Mesh(
    geometry5,
    new THREE.MeshLambertMaterial({ color: delaunycolor(), wireframe: surface(), side: THREE.DoubleSide })
  );
  mesh5.visible = delauny3();
  group.add(mesh5);
  //////////////////convex testing
  render();
}

function getIndexedGeom(array) {

  let points3d = [];
  for (let i = 0; i < array.length; i += 3) {
    points3d.push(new THREE.Vector3(parseFloat(array[i]), parseFloat(array[i + 1]), parseFloat(array[i + 2])));
  }
  let geometry1 = new THREE.BufferGeometry().setFromPoints(points3d);
  heapCvalue = geometry1.attributes.position.array[2];
  geometry1.center();
  heapCvalue -= geometry1.attributes.position.array[2];

  let indexDelaunay = Delaunator.from(
    points3d.map(v => {
      return [v.x, v.y];
    })
  );

  let meshIndex = []; // delaunay index => three.js index
  for (let i = 0; i < indexDelaunay.triangles.length; i++) {
    meshIndex.push(indexDelaunay.triangles[i]);
  }

  geometry1.setIndex(meshIndex); // add three.js index to the existing geometry
  return geometry1;
}

/*function getminmaxhegiht(lines){
  let min=Infinity, max=-Infinity, values=[];
  let zvalue;
  for ( let line of lines ) {
    line = line.trim();
    if ( line.charAt( 0 ) === '#' ) continue; // skip comments
    let lineValues = line.split( /\s+/ );
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

function getminmaxheightfromjson(lines) {
  let min = Infinity, max = -Infinity, values = [];
  let zvalue;

  lines.forEach(function (line) {
    zvalue = parseFloat(line.z);
    if (min > zvalue) {
      min = zvalue;
    }
    if (max < zvalue) {
      max = zvalue;
    }
  });

  values.push(min);
  values.push(max);
  return values;
}

//main load

init_highlow();
main();
// animate();





//tool control
function selectedcolor() {
  return document.getElementById('selectedcolor').value;
}
function selectedsize() {
  return document.getElementById('vol').value;
}
function pointcolor() {
  return document.getElementById('pointcolor').value;
}
function delaunycolor() {
  return document.getElementById('delaunycolor').value;
}
function delauny() {
  return document.getElementById('delauny').checked;
}
function delauny3() {
  return document.getElementById('delauny3').checked;
}
function heightmapColor() {
  return document.getElementById('heightmapColor').checked;
}
function surface() {
  return !document.getElementById('surface').checked;
}


const PolygonColor = document.getElementById('polygoncolor');
PolygonColor.addEventListener('input', function () {
  polygonRender()
});

const SelectedSize = document.getElementById('vol');
SelectedSize.addEventListener('input', function () {
  setSelectedSize(this.value)
  render()
});

function setSelectedSize(c) {
  group.children[2].material.size = c;
  group.children[2].material.needsUpdate = true;
}

const SelectedColor = document.getElementById('selectedcolor');
SelectedColor.addEventListener('input', function () {
  setSelectedColor(this.value)
  render()
});

function setSelectedColor(c) {
  group.children[2].material.color.set(c);
}


const Pointcolors = document.getElementById('pointcolor');
Pointcolors.addEventListener('input', function () {
  setPointColor(this.value)
  render()
});

function setPointColor(c) {
  group.children[0].material.color.set(c);
  group.children[1].material.color.set(c);
}


const Delaunycolors = document.getElementById('delaunycolor');
Delaunycolors.addEventListener('input', function () {
  setDelaunyColor(this.value)
  render()
});

// const Delaunycolors3 = document.getElementById('delaunycolor3');
// Delaunycolors3.addEventListener('input', function () {
//   setDelaunyColor3(this.value)
//   render()
// });

function setDelaunyColor(c) {

  group.children[3].material.color.set(c);
}

// function setDelaunyColor3(c) {
//   group.children[3].material.color.set(c);
// }

document.getElementById('delaunyDiv').addEventListener('click', function () {
  let two = document.getElementById('delauny');
  if (!two.checked) {
    group.children[1].visible = false;
  }
  else {
    group.children[1].visible = true;
  };
  render()
});

document.getElementById('delaunyDiv3').addEventListener('click', function () {
  let two = document.getElementById('delauny3');
  if (!two.checked) {
    group.children[3].visible = false;
  }
  else {
    group.children[3].visible = true;
  };
  render()
});

document.getElementById('surfaceDiv').addEventListener('click', function () {
  let two = document.getElementById('surface');
  if (!two.checked) {
    group.children[1].material.wireframe = true;
    group.children[3].material.wireframe = true;
  }
  else {
    group.children[1].material.wireframe = false;
    group.children[3].material.wireframe = false;
  };
  render()
});

document.getElementById('heightmapColorDiv').addEventListener('click', function () {
  let two = document.getElementById('heightmapColor');
  if (!two.checked) {
    ////console.log(group)
    document.getElementById('pointcolor').disabled = false;
    setPointColor(pointcolor())

    group.children[0].material.vertexColors = false;
    group.children[0].material.needsUpdate = true;
    group.children[1].material.vertexColors = false;
    group.children[1].material.needsUpdate = true;
  }
  else {
    ////console.log(group)
    document.getElementById('pointcolor').disabled = true;
    setPointColor("#ffffff")
    group.children[0].material.vertexColors = true;
    group.children[0].material.needsUpdate = true;
    group.children[1].material.vertexColors = true;
    group.children[1].material.needsUpdate = true;
  };
  render()

});

function settoolState(tool) {
  document.getElementById('btn-' + toolState).classList.remove('active')
  toolState = tool;
  document.getElementById('btn-' + toolState).classList.add('active')
  // console.log({btn:document.getElementById('btn-'+tool)})
}

document.getElementById('btn-move').addEventListener('click', function () {
  polygon = [];
  count = 0;
  unselectedPoints = [...group.children[0].geometry.attributes.position.array];
  selectedGroup.geometry.setDrawRange(0, count);
  settoolState('move')
  render()
  polygonRender()
});

document.getElementById('btn-point').addEventListener('click', function () {
  polygon = [];
  count = 0;
  unselectedPoints = [...group.children[0].geometry.attributes.position.array];
  selectedGroup.geometry.setDrawRange(0, count);
  settoolState('point')
  render()
  polygonRender()
});

document.getElementById('btn-polygon').addEventListener('click', function () {
  // if(toolState !== "polygon"){
  //   polygon = []
  // }
  polygon = [];
  count = 0;
  unselectedPoints = [...group.children[0].geometry.attributes.position.array];
  selectedGroup.geometry.setDrawRange(0, count);
  settoolState('polygon')
  render()
  polygonRender()
});

document.getElementById('btn-pencil').addEventListener('click', function () {
  polygon = [];
  count = 0;
  unselectedPoints = [...group.children[0].geometry.attributes.position.array];
  selectedGroup.geometry.setDrawRange(0, count);
  settoolState('pencil')
  render()
  polygonRender()
});

document.getElementById('btn-check').addEventListener('click', function () {
  if (count < 4) {
    alert("Delaunay 3D triangulation requires 4 or more points.")
    return;
  }
  let updatePoints = [];
  for (let i = 0; i < count; i++) {
    updatePoints.push(selectedPoints[i * 3], selectedPoints[i * 3 + 1], selectedPoints[i * 3 + 2])
  }

  let array = group.children[0].geometry.attributes.position.array;
  addToHistory(array)

  polygon = [];
  count = 0;
  selectedGroup.geometry.setDrawRange(0, count);
  reloadModelFromArray(updatePoints, true);
  render()
  polygonRender()
});

document.getElementById('btn-delete').addEventListener('click', function () {
  if (unselectedPoints.length < 12) {
    alert("Delaunay 3D triangulation requires 4 or more points.")
    return;
  }

  let array = group.children[0].geometry.attributes.position.array;
  addToHistory(array)

  polygon = [];
  count = 0;
  selectedGroup.geometry.setDrawRange(0, count);
  reloadModelFromArray(unselectedPoints, true);
  render()
  polygonRender()
});

document.getElementById('btn-change').addEventListener('click', function () {
  polygon = [];
  // selectedGroup.geometry.setDrawRange(0, 0);
  let unselec2 = [...unselectedPoints];
  unselectedPoints = [];
  console.log(count, unselec2)
  for (let i = 0; i < count; i++) {
    unselectedPoints.push(selectedPoints[i * 3], selectedPoints[i * 3 + 1], selectedPoints[i * 3 + 2])
  }
  count = unselec2.length / 3;
  for (let i = 0; i < unselec2.length; i += 3) {
    selectedPoints[i] = unselec2[i];
    selectedPoints[i + 1] = unselec2[i + 1];
    selectedPoints[i + 2] = unselec2[i + 2];
  }
  selectedGroup.geometry.setDrawRange(0, count);
  selectedGroup.geometry.attributes.position.needsUpdate = true;
  render()
  polygonRender()
});

document.getElementById('f1-filter').addEventListener('click', function () {
  filters.startProgress()
  setTimeout(() => {
    new Promise((resolve, reject) => {
      polygon = [];
      let array = group.children[0].geometry.attributes.position.array;
      addToHistory(array)
      let filteredPoints = filters.gridMinimumFilter(document.getElementById('f1-cell-size').value, array)
      resolve(filteredPoints)
    }).then((filteredPoints) => {
      filters.endProgress()
      if (filteredPoints.length < 12) {
        alert("Delaunay 3D triangulation requires 4 or more points.")
        return;
      }
      reloadModelFromArray(filteredPoints, true)
      render()
      polygonRender()
    })
  }, 100)


});

document.getElementById('f2-filter').addEventListener('click', function () {
  filters.startProgress()
  setTimeout(() => {
    new Promise((resolve, reject) => {
      polygon = [];
      let array = group.children[0].geometry.attributes.position.array;
      addToHistory(array)
      let filteredPoints = filters.voxelGridFilter(document.getElementById('f2-cell-size').value, array)
      resolve(filteredPoints)
    }).then((filteredPoints) => {
      filters.endProgress()
      if (filteredPoints.length < 12) {
        alert("Delaunay 3D triangulation requires 4 or more points.")
        return;
      }
      reloadModelFromArray(filteredPoints, true)
      render()
      polygonRender()
    })
  }, 100)

});

document.getElementById('f3-filter').addEventListener('click', function () {
  filters.startProgress()
  setTimeout(() => {
    new Promise((resolve, reject) => {
      polygon = [];
      let array = group.children[0].geometry.attributes.position.array;
      addToHistory(array)
      let num = document.getElementById('f3-number').value;
      let dev = document.getElementById('f3-deviation').value;
      let filteredPoints = filters.updatedRemovalFilter(num, dev, array)
      // return;
      resolve(filteredPoints)
    }).then((filteredPoints) => {
      filters.endProgress()
      if (filteredPoints.length < 12) {
        alert("Delaunay 3D triangulation requires 4 or more points.")
        return;
      }
      reloadModelFromArray(filteredPoints, true)
      render()
      polygonRender()
    })
  }, 100)
});

document.getElementById('f4-filter').addEventListener('click', function () {
  filters.startProgress()
  setTimeout(() => {
    new Promise((resolve, reject) => {
      polygon = [];
      let array = group.children[0].geometry.attributes.position.array;
      addToHistory(array)
      let limit1 = document.getElementById('f4-limit1').value;
      let limit2 = document.getElementById('f4-limit2').value;
      let pass = document.getElementById('f4-pass').value;
      let filteredPoints = filters.passThroughFilter(pass, limit1, limit2, array)
      resolve(filteredPoints)
    }).then((filteredPoints) => {
      filters.endProgress()
      if (filteredPoints.length < 12) {
        alert("Delaunay 3D triangulation requires 4 or more points.")
        return;
      }
      reloadModelFromArray(filteredPoints, true)
      render()
      polygonRender()
    })
  }, 100)
});

function addToHistory(array) {
  historys.data[historys.step] = [...array];
  historys.step++;
}

document.getElementById('editArea').addEventListener('keypress', (e) => {
  console.log({ d: document.getElementById('editArea') })
  polygon = [];
  if (e.keyCode == 26 && e.ctrlKey && historys.step > 0) {
    e.preventDefault();
    reloadModelFromArray(historys.data[historys.step - 1])
    render()
    polygonRender()
    historys.step--;
  }
  else if (e.keyCode == 81 && e.shiftKey) {
    console.log(1)
    $("#delauny").trigger('click');
  }
  else if (e.keyCode == 87 && e.shiftKey) {
    console.log(2)
    $("#delauny3").trigger('click');
  }
  else if (e.keyCode == 69 && e.shiftKey) {
    console.log(3)
    $("#surface").trigger('click');
  }
  else if (e.keyCode == 82 && e.shiftKey) {
    console.log(4)
    $("#heightmapColor").trigger('click');
  }
  else if (e.keyCode == 65 && e.shiftKey) {
    console.log(5)
    $("#btn-move").trigger('click');
  }
  else if (e.keyCode == 83 && e.shiftKey) {
    console.log(6)
    $("#btn-directSave").trigger('click');
  }
  else if (e.keyCode == 68 && e.shiftKey) {
    console.log(7)
    $("#btn-polygon").trigger('click');
  }
  else if (e.keyCode == 70 && e.shiftKey) {
    console.log(8)
    $("#btn-pencil").trigger('click');
  }
  else if (e.keyCode == 90 && e.shiftKey) {
    console.log(9)
    $("#btn-point").trigger('click');
  }
  else if (e.keyCode == 88 && e.shiftKey) {
    console.log(10)
    $("#btn-delete").trigger('click');
  }
  else if (e.keyCode == 67 && e.shiftKey) {
    console.log(11)
    $("#btn-change").trigger('click');
  }
  else if (e.keyCode == 86 && e.shiftKey) {
    console.log(12)
    $("#btn-check").trigger('click');
  }
  // else if (e.keyCode == 25 && e.ctrlKey && historys.step < historys.data.length - 1) {
  //   historys.step++;
  //   reloadModelFromArray(historys.data[historys.step])
  //   render()
  //   polygonRender()
  //   historys.step--;
  // }
}, false);

function download(filename, type, text) {
  let element = document.createElement('a');
  element.setAttribute('href', `data:${type}/plain;charset=utf-8,` + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

document.getElementById('obj-download').addEventListener('click', () => {
  const exporter = new OBJExporter();
  const result = exporter.parse(group.children[1]);
  download('model.obj', 'object', result);
})
document.getElementById('obj-download3').addEventListener('click', () => {
  const exporter = new OBJExporter();
  const result = exporter.parse(group.children[3]);
  download('model(3Dmesh).obj', 'object', result);
})
document.getElementById('txt-download').addEventListener('click', () => {
  let result = "";
  let array = group.children[0].geometry.attributes.position.array;

  for (let i = 0; i < array.length; i += 3) {
    result += `        ${array[i]},        ${array[i + 1]},        ${array[i + 2]}\n`;
  }
  download('model.txt', 'text', result);
})

document.getElementById('btn-volume').addEventListener('click', () => {

  // console.log(heapCvalue, groundTop, averageTop, maxTop, minTop)
  e1 = 0;
  e2 = 0;
  // console.log('groundTop', getVolume(group.children[0].geometry, groundTop))
  // console.log(e1, e2)
  // e1 = 0;
  // e2 = 0;
  // console.log('averageTop', getVolume(group.children[0].geometry, averageTop))
  // console.log(e1, e2)
  // e1 = 0;
  // e2 = 0;
  // console.log('maxTop', getVolume(group.children[0].geometry, parseFloat(maxTop)))
  // console.log(e1, e2)
  // e1 = 0;
  // e2 = 0;
  // console.log('minTop', getVolume(group.children[0].geometry, parseFloat(minTop)))
  // console.log(e1, e2)
  let h = document.getElementById('vheap-list').value;
  let v = document.getElementById('vground-list').value;

  let volume = Math.abs(getSelVolume(sessionHistory[h].data, sessionHistory[v].data));
  sessionHistory[h].volume = volume;
  $("#btn-vClose").trigger('click');
  alert(volume)
})

function getSelVolume(heap, ground) {
  let geometry = getIndexedGeom(heap);
  let sum2 = 0;
  let GT = 0;
  let p1 = new THREE.Vector3(),
    p2 = new THREE.Vector3(),
    p3 = new THREE.Vector3();

  for (let i = 2; i < ground.length; i += 3) {
    GT += parseFloat(ground[i]);
  }
  GT /= (ground.length / 3);
  console.log(heapCvalue, GT, averageTop)
  let position = geometry.attributes.position;
  let index = geometry.index;
  let faces = index.count / 3;
  for (let i = 0; i < faces; i++) {
    let result = 0;
    p1.fromBufferAttribute(position, index.array[i * 3 + 0]);
    p2.fromBufferAttribute(position, index.array[i * 3 + 1]);
    p3.fromBufferAttribute(position, index.array[i * 3 + 2]);
    p1.z += heapCvalue - GT;
    p2.z += heapCvalue - GT;
    p3.z += heapCvalue - GT;
    if (p1.z > 0 && p2.z <= 0 && p3.z <= 0) result = e1Volume(p1, p2, p3);
    else if (p2.z > 0 && p1.z <= 0 && p3.z <= 0) result = e1Volume(p2, p1, p3);
    else if (p3.z > 0 && p1.z <= 0 && p2.z <= 0) result = e1Volume(p3, p1, p2);
    else if (p3.z >= 0 && p2.z >= 0 && p1.z < 0) result = e2Volume(p3, p2, p1);
    else if (p1.z >= 0 && p3.z >= 0 && p2.z < 0) result = e2Volume(p1, p3, p2);
    else if (p1.z >= 0 && p2.z >= 0 && p3.z < 0) result = e2Volume(p1, p2, p3);
    else if (p1.z >= 0 && p2.z >= 0 && p3.z >= 0) result = signedVolumeOfTriangle(p1, p2, p3);

    sum2 += result;
  }
  return sum2;
}

function getVolume(geometry, ground) {
  let zTop = heapCvalue - ground;
  // let zTop = groundTop;

  if (!geometry.isBufferGeometry) {
    alert("'geometry' must be an indexed or non-indexed buffer geometry");
    return 0;
  }
  let isIndexed = geometry.index !== null;
  let position = geometry.attributes.position;
  let sum1 = 0;
  let sum2 = 0;
  let sum = 0;
  let p1 = new THREE.Vector3(),
    p2 = new THREE.Vector3(),
    p3 = new THREE.Vector3();
  if (!isIndexed) {
    let faces = position.count / 3;
    for (let i = 0; i < faces; i++) {
      p1.fromBufferAttribute(position, i * 3 + 0);
      p2.fromBufferAttribute(position, i * 3 + 1);
      p3.fromBufferAttribute(position, i * 3 + 2);
      p1.z += zTop;
      p2.z += zTop;
      p3.z += zTop;

      sum += signedVolumeOfTriangle(p1, p2, p3);
    }
  }
  else {
    let index = geometry.index;
    let faces = index.count / 3;
    for (let i = 0; i < faces; i++) {
      let result = 0;
      p1.fromBufferAttribute(position, index.array[i * 3 + 0]);
      p2.fromBufferAttribute(position, index.array[i * 3 + 1]);
      p3.fromBufferAttribute(position, index.array[i * 3 + 2]);
      p1.z += zTop;
      p2.z += zTop;
      p3.z += zTop;
      // console.log(p1.z)
      // console.log(p1.z, p2.z, p3.z)
      // if (p1.z < 0 && p2.z >= 0 && p3.z >= 0) result = e1Volume(p1, p2, p3);
      // else if (p2.z < 0 && p1.z >= 0 && p3.z >= 0) result = e1Volume(p2, p1, p3);
      // else if (p3.z < 0 && p1.z >= 0 && p2.z >= 0) result = e1Volume(p3, p1, p2);
      // else if (p3.z <= 0 && p2.z <= 0 && p1.z > 0) result = e2Volume(p3, p2, p1);
      // else if (p1.z <= 0 && p3.z <= 0 && p2.z > 0) result = e2Volume(p1, p3, p2);
      // else if (p1.z <= 0 && p2.z <= 0 && p3.z > 0) result = e2Volume(p1, p2, p3);
      // else if (p1.z <= 0 && p2.z <= 0 && p3.z <= 0) result = signedVolumeOfTriangle(p1, p2, p3);
      if (p1.z > 0 && p2.z <= 0 && p3.z <= 0) result = e1Volume(p1, p2, p3);
      else if (p2.z > 0 && p1.z <= 0 && p3.z <= 0) result = e1Volume(p2, p1, p3);
      else if (p3.z > 0 && p1.z <= 0 && p2.z <= 0) result = e1Volume(p3, p1, p2);
      else if (p3.z >= 0 && p2.z >= 0 && p1.z < 0) result = e2Volume(p3, p2, p1);
      else if (p1.z >= 0 && p3.z >= 0 && p2.z < 0) result = e2Volume(p1, p3, p2);
      else if (p1.z >= 0 && p2.z >= 0 && p3.z < 0) result = e2Volume(p1, p2, p3);
      else if (p1.z >= 0 && p2.z >= 0 && p3.z >= 0) result = signedVolumeOfTriangle(p1, p2, p3);
      // result = signedVolumeOfTriangle(p1, p2, p3);
      // if (result > 0) sum1 += result;
      // else sum2 += result;
      // else sum1 += signedVolumeOfTriangle(p1, p2, p3);
      sum2 += result;
    }
  }
  // return Math.abs(sum);
  // return sum1 + "  ,  " + sum2;
  console.log(sum1)
  return sum2;
}

function signedVolumeOfTriangle(p1, p2, p3) {
  // let result = p1.dot(p2.cross(p3)) / 6.0;
  let result = (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) * (p1.z + p2.z + p3.z) / 6.0;
  return Math.abs(result);
  // console.log(result)
  // return result;
  // if (result > 0) return result; else return 0;
}

function e1Volume(p1, p2, p3) {
  e1++;
  let q = new THREE.Vector3().copy(p1);
  let w = new THREE.Vector3();
  let e = new THREE.Vector3();
  w.x = p2.x - (p2.z / (p2.z - p1.z) * (p2.x - p1.x));
  w.y = p2.y - (p2.z / (p2.z - p1.z) * (p2.y - p1.y));
  w.z = 0;
  e.x = p3.x - (p3.z / (p3.z - p1.z) * (p3.x - p1.x));
  e.y = p3.y - (p3.z / (p3.z - p1.z) * (p3.y - p1.y));
  e.z = 0;
  // console.log(p1, p2, p3, w, e)
  // console.log('1', signedVolumeOfTriangle(p1, p2, p3))
  // console.log('2', signedVolumeOfTriangle(q, w, e))
  return signedVolumeOfTriangle(q, w, e)
  // return signedVolumeOfTriangle(p1, p2, p3)
}
let e1 = 0, e2 = 0;
function e2Volume(p1, p2, p3) {
  e2++;
  let q = new THREE.Vector3().copy(p1);
  let w = new THREE.Vector3().copy(p2);
  let e = new THREE.Vector3();
  let r = new THREE.Vector3();
  e.x = p2.x - (p2.z / (p2.z - p3.z) * (p2.x - p3.x));
  e.y = p2.y - (p2.z / (p2.z - p3.z) * (p2.y - p3.y));
  e.z = 0;
  r.x = p1.x - (p1.z / (p1.z - p3.z) * (p1.x - p3.x));
  r.y = p1.y - (p1.z / (p1.z - p3.z) * (p1.y - p3.y));
  r.z = 0;
  // console.log(p1, p2, p3, e, r)
  return signedVolumeOfTriangle(q, e, r) + signedVolumeOfTriangle(new THREE.Vector3().copy(w), new THREE.Vector3().copy(e), new THREE.Vector3().copy(r))
  // return signedVolumeOfTriangle(p1, p2, p3)
}

//open file dialog
document.getElementById('btn-ground').addEventListener('click', () => {
  btn_open_ground();
})

function btn_open_ground() {
  $("#ground-file").trigger("click");
}

$('#ground-file').change(openGround_Fromlocal);

function openGround_Fromlocal(e) {
  let files = e.target.files;
  if (files.length < 1) {
    alert('select a file...');
    return;
  }
  let file = files[0];

  let reader = new FileReader();
  let model_text;
  reader.addEventListener("load", () => {
    // this will then display a text file
    model_text = reader.result;
    reloadGroundFromData(file.name, model_text);
    reloadHGlist(true);
  }, false);

  if (file) {
    reader.readAsText(file);
  }
}

document.getElementById('btn-directSave').addEventListener('click', () => {
  document.getElementById('ds-modelName').value = document.getElementById('modelpath').innerText;
  document.getElementById('ds-modelVolume').value = sessionHistory[sessionHistory.length - 1].volume || 0;
})

document.getElementById('directSaveBtn').addEventListener('click', () => {
  let array = group.children[0].geometry.attributes.position.array;
  let savedata = [];
  for (let i = 2; i < array.length; i += 3) {
    savedata.push(array[i] + heapCvalue);
  }
  const dataobj = new Date();
  let year = dataobj.getFullYear();
  let month = dataobj.getMonth() + 1;
  let date = dataobj.getDate();
  let hour = dataobj.getHours();
  let min = dataobj.getMinutes();
  let sec = dataobj.getSeconds();
  // let jsonData = [];
  // for (let i = 0; i < array.length; i += 3) {
  //   jsonData.push({
  //     x: array[i],
  //     y: array[i + 1],
  //     z: array[i + 2]
  //   })
  // }
  // loading.style.display = 'block';
  $('#btn-dsClose').trigger('click');
  $.ajax({
    url: "/data/modelsave",
    data: {
      db: document.getElementById('ds-database').value,
      col: document.getElementById('ds-collection').value,
      modeldata:
      // {
      //   "datetime": `${date}.${month}.${year} ${hour}:${min}:${sec}`,
      //   "measurement": [{
      //     "date": `${year}-${month}-${date}`,
      //     "mass": '',
      //     "name": document.getElementById('ds-modelName').value,
      //     "pointcloud": jsonData,
      //     "remark": "",
      //     "time": `${hour}:${min}:${sec}`,
      //     "volume": document.getElementById('ds-modelVolume').value,
      //   }],
      //   "modifeod": "06.10.2021 22:19:47",
      //   "name": "DeutscheBarytIndustrieOwlEye",
      // }
      {
        "date": `${year}.${month}.${date}`,
        "name": document.getElementById('ds-modelName').value,
        "data": savedata,
        "time": `${hour}:${min}:${sec}`,
        "type": `model`,
        "volume": document.getElementById('ds-modelVolume').value,
      }
    },
    type: "post"
  }).done((res) => {
    if (res.success)
      alert('successfully saved');
    else alert(res.error + "(saving failed)");
    // loading.style.display = 'none';
    // $('#btn-dsClose').trigger('click');
  }).fail(() => {
    alert('network error(saving failed)');
    // loading.style.display = 'none';
    // $('#btn-dsClose').trigger('click');
  })
})

function getDate() {
  const dataobj = new Date();
  let year = dataobj.getFullYear();
  let month = dataobj.getMonth() + 1;
  let date = dataobj.getDate();
  return `${year}.${month}.${date}`;

}

function getTime() {
  const dataobj = new Date();
  let hour = dataobj.getHours();
  let min = dataobj.getMinutes();
  let sec = dataobj.getSeconds();
  return `${hour}:${min}:${sec}`;
}
document.getElementById('browser-load').addEventListener('click', () => {
  let id1 = document.getElementById('cdatabase-list').value;
  let id2 = document.getElementById('ccollection-list').value;
  let database = dblist[id1].db;
  let collection = dblist[id1].col[id2];
  console.log(dblist, database, collection)
  $.ajax({
    url: "/data/getmodellist",
    data: {
      db: database,
      col: collection
    },
    type: "post"
  }).done((res) => {
    if (res.success) {
      console.log(res.data)
      const htable = document.getElementById('database-models');
      htable.innerHTML = '';
      for (let i = res.data.length - 1; i >= 0; i--) {
        htable.innerHTML += `<tr>
        <td>${res.data[i].name}</td>
        <td>${res.data[i].date}</td>
        <td>${res.data[i].time}</td>
        <td>${res.data[i].type}</td>
        <td style="width:170px;">
          <button data-id=${i} type='button' class="dload-btn btn btn-icon btn-outline-primary  round btn-sm mr-1"
            title='loading'><i class="ft-upload"></i>
          </button>
        </td>
      </tr>`;
      }
      $('.dload-btn').click(function () {
        console.log({ data: res.data })
        document.getElementById('modelpath').innerText = this.parentElement.parentElement.children[0].innerText;
        reloadModelFromArray(res.data[this.dataset.id].data, 'withoutheap', true);
        $('#browser-close').trigger('click');
      })
    }
    else alert(res.error);
    // $('#browser-close').trigger('click');
  }).fail(() => {
    alert('network error');
    $('#browser-close').trigger('click');
  })
})
document.getElementById('btn-emb').addEventListener('click', () => {
  $.ajax({
    url: "/data/getdatabaselist",
    type: "get"
  }).done((res) => {
    if (res.error) alert('db error');
    else if (res.success) {
      console.log(res.data)
      dblist = res.data;
      if (dblist.length == 0) return;
      const database = document.getElementById('cdatabase-list');
      const collection = document.getElementById('ccollection-list');
      database.innerHTML = "";
      collection.innerHTML = "";
      for (let i = 0; i < dblist.length; i++) {
        database.innerHTML += `<option value="${i}">${dblist[i].db}</option>`;
      }
      for (let i = 0; i < dblist[0].col.length; i++) {
        collection.innerHTML += `<option value="${i}">${dblist[0].col[i]}</option>`;
      }
      database.addEventListener('change', () => {
        let id = database.value;
        collection.innerHTML = "";
        for (let i = 0; i < dblist[id].col.length; i++) {
          collection.innerHTML += `<option value="${i}">${dblist[id].col[i]}</option>`;
        }
      })
    }
  }).fail(() => {
    alert('network error');
  })
  const htable = document.getElementById('history-models');
  htable.innerHTML = '';
  for (let i = sessionHistory.length - 1; i >= 0; i--) {
    if (!sessionHistory[i].deleted) {
      htable.innerHTML += `<tr>
        <td contenteditable="true" data-id=${i}>${sessionHistory[i].name}</td>
        <td>${sessionHistory[i].date}</td>
        <td>${sessionHistory[i].time}</td>
        <td>${sessionHistory[i].type}</td>
        <td>${sessionHistory[i].volume}</td>
        <td style="width:170px;">
          <button data-id=${i} type='button' class="hload-btn btn btn-icon btn-outline-primary  round btn-sm mr-1"
            title='loading'><i class="ft-upload"></i>
          </button>
          <button data-id=${i} type='button' class="hdel-btn btn btn-icon btn-outline-primary  round btn-sm"
            title='delete'><i class="ft-x-square"></i>
          </button>
        </td>
      </tr>`;
    }
  }
  $('.hload-btn').click(function () {
    console.log({ this: this })
    document.getElementById('modelpath').innerText = this.parentElement.parentElement.children[0].innerText;
    reloadModelFromArray(sessionHistory[this.dataset.id].data, 'withoutheap', true);
    $('#browser-close').trigger('click');
  })
  $('.hdel-btn').click(function () {
    console.log({ this: this })
    sessionHistory[this.dataset.id].deleted = true;
    $(this.parentElement.parentElement).remove();
    // $('#browser-close').trigger('click');
  })
})
document.getElementById('browser-save').addEventListener('click', () => {
  let database = document.getElementById('hdatabase-name').value.trim();
  let collection = document.getElementById('hcollection-name').value.trim();
  if (database == "" || collection == "") {
    alert('please enter database and collection name for saving.')
    return;
  }
  let savedata = [];
  let clonelist = document.getElementById('history-models').children;
  for (let i = 0; i < clonelist.length; i++) {
    let n = clonelist[i].children[0].dataset.id;
    sessionHistory[n].name = clonelist[i].children[0].innerText.trim();
    savedata.push(sessionHistory[n]);
  }
  // loading.style.display = 'block';
  $('#browser-close').trigger('click');
  $.ajax({
    url: "/data/multimodelsave",
    data: {
      database,
      collection,
      savedata
    },
    type: "post"
  }).done((res) => {
    if (res.success)
      alert('successfully saved');
    else alert(res.error + '(saving failed)');
    // loading.style.display = 'none';
    // $('#browser-close').trigger('click');

  }).fail(() => {
    alert('network error(saving failed)');
    // loading.style.display = 'none';
    // $('#browser-close').trigger('click');
  })
  sessionHistory = sessionHistory.filter((e, id) => {
    return !e.deleted;
  })

})
document.getElementById('bhistory-tab').addEventListener('click', () => {
  document.getElementById('browser-save').style.display = 'inline-block';
})
document.getElementById('bdatabase-tab').addEventListener('click', () => {
  document.getElementById('browser-save').style.display = 'none';
})
const loading = document.getElementById('loading');

document.getElementById('btn-vol').addEventListener('click', () => {
  reloadHGlist();
})

function reloadHGlist(heapSelec = false) {
  const heap = document.getElementById('vheap-list');
  const ground = document.getElementById('vground-list');
  let hv = heap.value;
  heap.innerHTML = "";
  ground.innerHTML = "";
  for (let i = sessionHistory.length - 1; i >= 0; i--) {
    heap.innerHTML += `<option value='${i}' ${(heapSelec && hv == i) && "selected"} title = "${sessionHistory[i].type} ${sessionHistory[i].date} ${sessionHistory[i].time}" > ${sessionHistory[i].name}</option > `;
    ground.innerHTML += `<option value='${i}' title = "${sessionHistory[i].type} ${sessionHistory[i].date} ${sessionHistory[i].time}" > ${sessionHistory[i].name}</option > `;
  }
}


// alert(new THREE.Vector3(parseFloat(2), parseFloat(2), parseFloat(2)).dot(new THREE.Vector3(parseFloat(4), parseFloat(2), parseFloat(2)).cross(new THREE.Vector3(parseFloat(2), parseFloat(4), parseFloat(2)))) / 6.0)