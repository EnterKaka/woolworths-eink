import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { OBJLoader } from './OBJLoader.js';
import Delaunator from './delaunator.js';
import * as filters from './filters.js';

import { OBJExporter } from './OBJExporter.js';

import { ConvexGeometry } from './ConvexGeometry.js';

// import { PCDLoader } from './PCDLoader.js';
import { XYZLoader, getminmaxhegiht, getminmaxhegihtfromarray, getminmaxheightfromjson, getrgb, init_highlow } from './XYZLoader.js';
import { TrackballControls } from './TrackballControls.js';


export const owlStudio = function (cv1, cv2, parent) {

    this.canvas = document.getElementById(cv1);
    this.canvas2 = document.getElementById(cv2);
    this.parent_canvas = document.getElementById(parent);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, this.canvas.clientWidth / this.canvas.clientHeight, 0.01, 1000);
    this.cameraLookAt = new THREE.Vector3();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.group = new THREE.Object3D();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.mouse = {
        target: new THREE.Vector2(),
        down: false,
        rightDown: false,
        x: 0,
        y: 0,
    };
    this.polygon = [];
    this.history = {
        step: 0,
        data: []
    }
    this.sessionHistory = [];
    this.selectedGroup;//points
    this.unselectedPoints = [];
    this.selectedPoints = [];
    this.selectedCount = 0;
    this.toolState = 'rotate';
    this.drawState = false;
    this.transDir = 'xy';
    this.position = new THREE.Vector3();
    this.quaternion = new THREE.Quaternion();
    this.matrixElements = new THREE.Matrix4().elements;
    this.changedPosition = {
        x: 0, y: 0, z: 0
    };

    this.init = function () {

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);

        this.camera.position.set(0, -20, 6);
        this.camera.lookAt(0, 0, 0);

        var light = new THREE.DirectionalLight(0xffffff, 1.5);
        light.position.set(0, 0, 56);

        this.scene.add(light);
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        this.scene.add(this.camera);
        this.scene.add(this.group);
        this.scene.background = new THREE.Color(0x111111);

        // controls.addEventListener('change', render); // call this only in static scenes (i.e., if there is no animation loop)
        // controls.minDistance = 0.1;
        // controls.maxDistance = 100;
        // // controls.enableRotate = true;
        // controls.maxPolarAngle = Infinity;
        // controls.enableRotate = false;

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
        // scene.add(gridYZ);

        window.addEventListener('resize', this.windowResize);
    }

    this.initHistory = function () {
        this.history.step = 0;
        this.history.data = [];
    }

    this.addToHistory = function (array) {
        this.history.data[this.history.step] = array;
        this.history.step++;
        console.log('historyed')
    }

    this.addToSessionHistory = function (filename, type, arrayData) {
        this.sessionHistory.push({
            name: filename,
            date: getDate(),
            time: getTime(),
            type: type,
            data: arrayData,
            matrix: [...this.matrixElements]
        })
    }

    this.reloadModelFromData = function (filename, data) {
        this.initHistory();
        let lines = data.split('\n');
        let colors = [];
        let points3d = [];
        let values = getminmaxhegiht(lines);
        let min = values[0];
        let max = values[1];

        for (let line of lines) {
            line = line.trim();
            if (line.charAt(0) === '#') continue; // skip comments
            let lineValues = line.split(/\s+/);
            if (lineValues.length === 3) {
                // XYZ
                points3d.push(new THREE.Vector3(parseFloat(lineValues[0]), parseFloat(lineValues[1]), parseFloat(lineValues[2])));
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

        let geometry = new THREE.BufferGeometry().setFromPoints(points3d);

        if (colors.length > 0) {
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        }

        this.reloadModelTool(filename, geometry, points3d)

    }

    this.reloadModelFromJSONData = function (filename, data) {
        this.initHistory();
        let colors = [];
        let points3d = [];
        let values = getminmaxheightfromjson(data);
        let min = values[0];
        let max = values[1];
        data.forEach(function (xyz) {
            points3d.push(new THREE.Vector3(parseFloat(xyz.x), parseFloat(xyz.y), parseFloat(xyz.z)));
            let zvalue = parseFloat(xyz.z);
            let k = (zvalue - min) / (max - min);
            let rgb = getrgb(k);
            //set color from xyz
            colors.push(rgb[0]);
            colors.push(rgb[1]);
            colors.push(rgb[2]);
        });

        let geometry = new THREE.BufferGeometry().setFromPoints(points3d);

        if (colors.length > 0) {
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        }

        this.reloadModelTool(filename, geometry, points3d)
    }

    this.reloadModelFromObjData = function (filename, data) {
        this.initHistory();
        let geometry = new THREE.BufferGeometry();
        let loader = new OBJLoader();
        let points3d = [];
        let colors = [];

        geometry.copy(loader.parse(data).children[0].geometry);

        let points = geometry.attributes.position.array;
        let values = getminmaxhegihtfromarray(points);
        let min = values[0];
        let max = values[1];

        for (let i = 0; i < points.length; i += 3) {
            points3d.push(new THREE.Vector3(points[i], points[i + 1], points[i + 2]))
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
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        }

        this.reloadModelTool(filename, geometry, points3d)
    }

    this.reloadModelFromArray = function (filename, data, neededCenter = true) {
        console.log(data.length)
        let colors = [];
        let points3d = [];
        let values = getminmaxhegihtfromarray(data);
        let min = values[0];
        let max = values[1];

        for (let i = 0; i < data.length; i += 3) {
            points3d.push(new THREE.Vector3(parseFloat(data[i]), parseFloat(data[i + 1]), parseFloat(data[i + 2])));

            let zvalue = parseFloat(data[i + 2]);
            let k = (zvalue - min) / (max - min);
            let rgb = getrgb(k);
            //set color from xyz
            colors.push(rgb[0]);
            colors.push(rgb[1]);
            colors.push(rgb[2]);
        }

        let geometry = new THREE.BufferGeometry().setFromPoints(points3d);

        if (colors.length > 0) {
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        }

        this.reloadModelTool(filename, geometry, points3d, neededCenter)
    }

    this.reloadModelTool = function (filename, geometry, points3d, neededCenter = true) {

        $("#modelpath").text(filename);
        let saveData = [];
        // if (neededCenter) {
        points3d.map((e) => {
            saveData.push(e.x, e.y, e.z);
        })
        // }
        // else {
        // points3d.map((e) => {
        // saveData.push(e.x, e.y, e.z + this.changedCloudZ);
        // })
        // }

        this.addToSessionHistory(filename, 'model', saveData);

        if (neededCenter) {
            //     this.changedCloudZ = geometry.attributes.position.array[2];
            //     geometry.center();
            //     this.changedCloudZ -= geometry.attributes.position.array[2];
            this.cameraPositionSetFromArray(geometry.attributes.position.array)
            this.group.position.copy(new THREE.Vector3())
            this.group.quaternion.copy(new THREE.Quaternion())
        }


        let material;
        if (heightmapColor()) {
            document.getElementById('pointcolor').disabled = true;
            material = new THREE.PointsMaterial({ size: 0.1, vertexColors: true, color: "#ffffff" });
        }
        else
            material = new THREE.PointsMaterial({ size: 0.1, vertexColors: false, color: pointcolor() });

        while (this.group.children.length > 0) {
            this.group.clear();
        }

        let points2 = new THREE.Points(geometry, material);
        this.group.add(points2);

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

        geometry.setIndex(meshIndex); // add three.js index to the existing geometry
        geometry.computeVertexNormals();

        let mesh = new THREE.Mesh(
            geometry, // re-use the existing geometry
            new THREE.MeshLambertMaterial({ color: heightmapColor() ? "#ffffff" : pointcolor(), wireframe: surface(), side: THREE.DoubleSide, vertexColors: heightmapColor(), })
        );
        mesh.visible = delauny();
        this.group.add(mesh);


        this.unselectedPoints = [...geometry.attributes.position.array];
        this.selectedPoints = new Float32Array(geometry.index.count * 3);
        console.log(this.selectedPoints.length, this.unselectedPoints.length, geometry.index.count)
        let geometry3 = new THREE.BufferGeometry();
        geometry3.setAttribute('position', new THREE.BufferAttribute(this.selectedPoints, 3));
        geometry3.setDrawRange(0, 0)
        this.selectedCount = 0;

        let material3 = new THREE.PointsMaterial({
            color: selectedcolor(),
            size: selectedsize()
        });

        this.selectedGroup = new THREE.Points(geometry3, material3);
        this.selectedGroup.frustumCulled = false;
        this.group.add(this.selectedGroup);


        let geometry5 = new ConvexGeometry(points3d);

        geometry5.computeBoundingSphere();
        // if (neededCenter) {
        //     geometry5.center()
        // }

        let mesh5 = new THREE.Mesh(
            geometry5,
            new THREE.MeshLambertMaterial({ color: delaunycolor(), wireframe: surface(), side: THREE.DoubleSide, })
        );

        mesh5.visible = delauny3();
        this.group.add(mesh5);

        //set axis helper
        var axes = new THREE.AxesHelper(20);
        this.group.add(axes);
        // //set grid helper
        var gridXZ = new THREE.GridHelper(0, 0);
        this.group.add(gridXZ);

        var gridXY = new THREE.GridHelper(30, 60);
        gridXY.rotation.x = Math.PI / 2;
        this.group.add(gridXY);

        var gridYZ = new THREE.GridHelper(30, 60);
        gridYZ.rotation.z = Math.PI / 2;
        this.group.add(gridYZ);

        this.render();
        console.log(this.group)
    }

    this.reloadGroundFromData = function (filename, data) {
        let lines = data.split('\n');
        this.averageTop = 0;
        let count = 0;
        let saveData = [];
        for (let line of lines) {
            line = line.trim();
            if (line.charAt(0) === '#') continue; // skip comments
            let lineValues = line.split(/\s+/);
            if (lineValues.length === 3) {
                saveData.push(lineValues[0], lineValues[1], lineValues[2])
                this.averageTop += parseFloat(lineValues[2]);
                count++;
            }
        }
        this.averageTop /= count;
        this.addToSessionHistory(filename, 'ground', saveData)
    }

    this.render = function () {
        this.renderer.render(this.scene, this.camera);
    }

    this.setCurrentMatrix = function () {
        // this.group.matrix.makeRotationFromQuaternion(this.group.quaternion);
        // this.group.matrix.setPosition(this.group.position);
        // this.group.matrixAutoUpdate = false;
        this.quaternion.copy(this.group.quaternion)
        this.position.copy(this.group.position)
        this.sessionHistory[this.sessionHistory.length - 1].matrix = [...this.group.matrix.elements];
    }

    this.setMatrixToHistory = function (id, array) {
        this.sessionHistory[id].matrix = array;
    }

    this.setFromRealMatrix = function () {
        this.group.position.copy(this.position)
        this.group.quaternion.copy(this.quaternion)
        // this.group.matrix.makeRotationFromQuaternion(this.quaternion);
        // this.group.matrix.setPosition(this.position);
        // this.group.applyMatrix(this.group.matrix);
        this.render();
    }

    this.polygonRender = function () {
        this.canvas2.height = this.canvas.clientHeight;
        this.canvas2.width = this.canvas.clientWidth;
        let ctx = this.canvas2.getContext("2d");
        let polygon = this.polygon;
        let width = polygonsize();
        ctx.clearRect(0, 0, this.canvas2.width, this.canvas2.height);
        if (polygon.length !== 0) {
            ctx.strokeStyle = polygoncolor();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.moveTo(polygon[0][0], polygon[0][1]);
            ctx.arc(polygon[0][0], polygon[0][1], 1, 0, 2 * Math.PI);
            for (let i = 1; i < polygon.length; i++) {
                ctx.lineTo(polygon[i][0], polygon[i][1]);
                // ctx.arc(polygon[i][0], polygon[i][1], 1, 0, 2 * Math.PI);
            }
            if (!this.drawState) ctx.closePath();
            ctx.stroke();
        }
    }

    this.rotateScene = (deltaX, deltaY) => {
        this.group.rotation.z += deltaX / 100;
        this.group.rotation.x += deltaY / 100;
        this.render()
    }

    this.rotateGroup = (evt) => {
        let deltaX = evt.clientX - this.mouse.x,
            deltaY = evt.clientY - this.mouse.y;
        this.mouse.x = evt.clientX;
        this.mouse.y = evt.clientY;
        this.group.rotation.z += deltaX / 100;
        this.group.rotation.x += deltaY / 100;
        this.render()
    }

    this.translateGroup = (evt) => {
        let deltaX = evt.clientX - this.mouse.x,
            deltaY = evt.clientY - this.mouse.y;
        this.mouse.x = evt.clientX;
        this.mouse.y = evt.clientY;
        if (this.transDir == 'xy') {
            this.group.translateX(deltaX / 100)
            this.group.translateY(-deltaY / 100)
        } else if (this.transDir == 'yz') {
            this.group.translateY(deltaX / 100)
            this.group.translateZ(-deltaY / 100)
        } else if (this.transDir == 'xz') {
            this.group.translateX(deltaX / 100)
            this.group.translateZ(-deltaY / 100)
        }
        this.render()
    }

    this.rotateAbs = (axis, degree) => {
        let x = 0, y = 0, z = 0;
        if (axis == 'x') {
            x = degree;
        } else if (axis == 'y') {
            y = degree;
        } else if (axis == 'z') {
            z = degree;
        }
        this.group.rotation.x += x;
        this.group.rotation.y += y;
        this.group.rotation.z += z;
        this.render()
    }

    this.translateAbs = (x, y, z) => {
        x = parseFloat(x)
        y = parseFloat(y)
        z = parseFloat(z)
        this.group.translateX(x)
        this.group.translateY(y)
        this.group.translateZ(z)
        this.render()
    }

    this.cameraMove = (evt) => {
        let deltaX = evt.clientX - this.mouse.x,
            deltaY = evt.clientY - this.mouse.y;
        this.mouse.x = evt.clientX;
        this.mouse.y = evt.clientY;
        this.camera.position.x -= deltaX / 35;
        this.camera.position.z += deltaY / 35;
        this.cameraLookAt.x -= deltaX / 35;
        this.cameraLookAt.z += deltaY / 35;
        this.camera.lookAt(this.cameraLookAt);
        this.render()

    }

    this.cameraPositionSetFromArray = (array) => {
        let x = 0;
        let y = 0;
        let z = 0;
        for (let i = 0; i < array.length; i += 3) {
            x += array[i];
            y += array[i + 1];
            z += array[i + 2];
        }
        let na = array.length / 3;
        x /= na;
        y /= na;
        z /= na;
        this.camera.position.x = x;
        this.camera.position.y = y - 20;
        this.camera.position.z = z + 6;
        this.cameraLookAt.x = x;
        this.cameraLookAt.y = y;
        this.cameraLookAt.z = z;
        this.camera.lookAt(this.cameraLookAt);
    }

    this.mouseMove = (evt) => {
        evt.preventDefault();
        if (this.mouse.down) {
            let deltaX = evt.clientX - this.mouse.x,
                deltaY = evt.clientY - this.mouse.y;
            this.mouse.x = evt.clientX;
            this.mouse.y = evt.clientY;
            this.rotateScene(deltaX, deltaY);
        } else if (this.mouse.rightDown) {
            let deltaX = evt.clientX - this.mouse.x,
                deltaY = evt.clientY - this.mouse.y;
            this.mouse.x = evt.clientX;
            this.mouse.y = evt.clientY;
            this.cameraMove(deltaX, deltaY)
        }
    }

    this.mouseUp = (evt) => {
        evt.preventDefault();
        this.mouse.down = false;
    }

    this.mouseRightUp = (evt) => {
        evt.preventDefault();
        this.mouse.rightDown = false;
    }

    this.mouseDown = (evt) => {
        evt.preventDefault();
        this.mouse.down = true;
        this.mouse.x = evt.clientX;
        this.mouse.y = evt.clientY;
    }

    this.mouseRightDown = (evt) => {
        evt.preventDefault();
        this.mouse.rightDown = true;
        this.mouse.x = evt.clientX;
        this.mouse.y = evt.clientY;
    }

    this.mouseWheel = (event) => {
        event.preventDefault();
        this.camera.position.y -= event.deltaY / 100;
        this.camera.position.z += event.deltaY / 100 * 3 / 10;
        this.cameraLookAt.y -= event.deltaY / 100;
        this.cameraLookAt.z += event.deltaY / 100 * 3 / 10;

        this.camera.lookAt(this.cameraLookAt);
        this.render()
    }

    this.addSelectedPoint = function (evt) {

        this.mouse.target.x = (evt.offsetX / this.canvas.clientWidth) * 2 - 1;
        this.mouse.target.y = - (evt.offsetY / this.canvas.clientHeight) * 2 + 1;
        let raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(this.mouse.target, this.camera);
        let pointOnPlane = new THREE.Vector3();
        let target = new THREE.Vector3();
        let group = this.group;

        if (this.group.children[0]) {
            if (evt.ctrlKey && this.selectedCount > 0) {
                let geometry = this.selectedGroup.geometry;
                let position = geometry.attributes.position;
                let minDistance = Infinity;
                let dind = 0;
                let lop = this.selectedCount;
                this.selectedCount = 0;

                for (let i = 0; i < lop; i++) {
                    pointOnPlane.copy(new THREE.Vector3(position.array[i * 3], position.array[i * 3 + 1], position.array[i * 3 + 2]))
                    raycaster.ray.closestPointToPoint(new THREE.Vector3().copy(pointOnPlane).applyMatrix4(this.group.matrix), target)
                    let distanceSq = new THREE.Vector3().copy(pointOnPlane).applyMatrix4(this.group.matrix).distanceToSquared(target);

                    if (distanceSq < minDistance) {
                        minDistance = distanceSq;
                        dind = i;
                    }
                }

                let newpoints = [...this.selectedPoints];
                for (let i = 0; i < lop; i++) {
                    if (i !== dind) {
                        this.selectedPoints[this.selectedCount * 3 + 0] = newpoints[i * 3];
                        this.selectedPoints[this.selectedCount * 3 + 1] = newpoints[i * 3 + 1];
                        this.selectedPoints[this.selectedCount * 3 + 2] = newpoints[i * 3 + 2];
                        this.selectedCount++;
                    }
                    else {
                        this.unselectedPoints.push(newpoints[i * 3], newpoints[i * 3 + 1], newpoints[i * 3 + 2])
                    }
                }

                this.selectedGroup.geometry.setDrawRange(0, this.selectedCount);
                this.selectedGroup.geometry.attributes.position.needsUpdate = true;

            }
            else if (evt.shiftKey) {
                let minDistance = Infinity;
                let sind;
                let closestPoint = new THREE.Vector3();
                let unselectedPoints = this.unselectedPoints;
                for (let i = 0; i < unselectedPoints.length; i += 3) {
                    raycaster.ray.closestPointToPoint(new THREE.Vector3(unselectedPoints[i], unselectedPoints[i + 1], unselectedPoints[i + 2]).applyMatrix4(this.group.matrix), target)
                    let distanceSq = new THREE.Vector3(unselectedPoints[i], unselectedPoints[i + 1], unselectedPoints[i + 2]).applyMatrix4(this.group.matrix).distanceToSquared(target);

                    if (distanceSq < minDistance) {
                        closestPoint.set(unselectedPoints[i], unselectedPoints[i + 1], unselectedPoints[i + 2]);
                        minDistance = distanceSq;
                        sind = i;
                    }
                }

                let unclonep = [...this.unselectedPoints];
                this.unselectedPoints = [];
                console.log('startconsole', unclonep)
                for (let i = 0; i < unclonep.length; i += 3) {
                    if (i != sind) this.unselectedPoints.push(unclonep[i], unclonep[i + 1], unclonep[i + 2])
                }
                console.log(closestPoint.x, closestPoint.y, closestPoint.z)
                this.selectedPoints[this.selectedCount * 3 + 0] = closestPoint.x;
                this.selectedPoints[this.selectedCount * 3 + 1] = closestPoint.y;
                this.selectedPoints[this.selectedCount * 3 + 2] = closestPoint.z;
                this.selectedCount++;
                this.selectedGroup.geometry.setDrawRange(0, this.selectedCount);
                this.selectedGroup.geometry.attributes.position.needsUpdate = true;
                console.log(this.selectedPoints, this.unselectedPoints)
            }
            else {
                let array = group.children[0].geometry.attributes.position.array;
                let minDistance = Infinity;
                let sind;
                let closestPoint = new THREE.Vector3();
                for (let i = 0; i < array.length; i += 3) {
                    raycaster.ray.closestPointToPoint(new THREE.Vector3(array[i], array[i + 1], array[i + 2]).applyMatrix4(this.group.matrix), target)
                    let distanceSq = new THREE.Vector3(array[i], array[i + 1], array[i + 2]).applyMatrix4(this.group.matrix).distanceToSquared(target);

                    if (distanceSq < minDistance) {
                        closestPoint.set(array[i], array[i + 1], array[i + 2]);
                        minDistance = distanceSq;
                        sind = i;
                    }
                }

                let unclonep = [];

                for (let i = 0; i < array.length; i += 3) {
                    if (i != sind) unclonep.push(array[i], array[i + 1], array[i + 2])
                }

                this.unselectedPoints = unclonep;
                this.selectedPoints[0] = closestPoint.x;
                this.selectedPoints[1] = closestPoint.y;
                this.selectedPoints[2] = closestPoint.z;
                this.selectedCount = 1;

                this.selectedGroup.geometry.setDrawRange(0, this.selectedCount);
                this.selectedGroup.geometry.attributes.position.needsUpdate = true;
            }
        }
        this.render()
    }

    this.drawPencil = (evt) => {
        this.polygon.push([evt.offsetX, evt.offsetY])
        this.polygonRender()
    }

    this.startPencil = (evt) => {
        if (!this.drawState) {
            this.polygon = [];
            this.drawState = true;
        }
        this.polygonRender()
    }

    this.drawPolygon = function (evt) {
        if (!this.drawState) {
            this.polygon = [];
            this.drawState = true;
        }
        this.polygon.push([evt.offsetX, evt.offsetY])
        this.polygonRender()
    }

    this.finishdraw = (evt) => {
        this.drawState = false;
        let raycaster = new THREE.Raycaster();
        let camera = this.camera;
        let pointOnPlane = new THREE.Vector3();
        let plane = this.plane;
        let canvas = this.canvas;
        let group = this.group;

        if (this.polygon.length > 2) {
            let vs = [];
            for (let i = 0; i < this.polygon.length; i++) {
                let mouse = new THREE.Vector2()
                mouse.x = (this.polygon[i][0] / canvas.clientWidth) * 2 - 1;
                mouse.y = - (this.polygon[i][1] / canvas.clientHeight) * 2 + 1;
                raycaster.setFromCamera(mouse, camera);
                raycaster.ray.intersectPlane(plane, pointOnPlane);
                vs.push({ x: pointOnPlane.x, z: pointOnPlane.z })
            }

            if (evt.ctrlKey && this.selectedCount > 0) {
                let geometry = this.selectedGroup.geometry;
                let position = geometry.attributes.position;
                let lop = this.selectedCount;
                this.selectedCount = 0;

                for (let i = 0; i < lop; i++) {
                    let direct = new THREE.Vector3(position.array[i * 3], position.array[i * 3 + 1], position.array[i * 3 + 2])
                    raycaster.set(camera.position, new THREE.Vector3().copy(direct).applyMatrix4(this.group.matrix).sub(camera.position).normalize());
                    raycaster.ray.intersectPlane(plane, pointOnPlane);

                    if (!isInside(pointOnPlane, vs)) {
                        this.selectedPoints[this.selectedCount * 3 + 0] = direct.x;
                        this.selectedPoints[this.selectedCount * 3 + 1] = direct.y;
                        this.selectedPoints[this.selectedCount * 3 + 2] = direct.z;
                        this.selectedCount++;
                    }
                    else {
                        this.unselectedPoints.push(direct.x, direct.y, direct.z)
                    }
                }
            }
            else if (evt.shiftKey) {
                let updatedUn = [];

                for (let i = 0; i < this.unselectedPoints.length; i += 3) {
                    let direct = new THREE.Vector3(this.unselectedPoints[i], this.unselectedPoints[i + 1], this.unselectedPoints[i + 2])
                    raycaster.set(camera.position, new THREE.Vector3().copy(direct).applyMatrix4(this.group.matrix).sub(camera.position).normalize());
                    raycaster.ray.intersectPlane(plane, pointOnPlane);

                    if (isInside(pointOnPlane, vs)) {
                        this.selectedPoints[this.selectedCount * 3 + 0] = direct.x;
                        this.selectedPoints[this.selectedCount * 3 + 1] = direct.y;
                        this.selectedPoints[this.selectedCount * 3 + 2] = direct.z;
                        this.selectedCount++;
                    }
                    else {
                        updatedUn.push(direct.x, direct.y, direct.z)
                    }
                }
                this.unselectedPoints = updatedUn;
            }
            else {
                this.selectedCount = 0;
                let geometry = group.children[0].geometry;
                let array = geometry.attributes.position.array;
                this.unselectedPoints = [];

                for (let i = 0; i < array.length; i += 3) {
                    raycaster.set(camera.position, new THREE.Vector3(array[i], array[i + 1], array[i + 2]).applyMatrix4(this.group.matrix).sub(camera.position).normalize());
                    raycaster.ray.intersectPlane(plane, pointOnPlane);

                    if (isInside(pointOnPlane, vs)) {
                        this.selectedPoints[this.selectedCount * 3 + 0] = array[i];
                        this.selectedPoints[this.selectedCount * 3 + 1] = array[i + 1];
                        this.selectedPoints[this.selectedCount * 3 + 2] = array[i + 2];
                        this.selectedCount++;
                    }
                    else {
                        this.unselectedPoints.push(array[i], array[i + 1], array[i + 2])
                    }
                }
                console.log(this.selectedPoints.length, this.unselectedPoints.length)
            }

            this.selectedGroup.geometry.setDrawRange(0, this.selectedCount);
            this.selectedGroup.geometry.attributes.position.needsUpdate = true;
        }
        this.render()
        this.polygonRender()
    }

    this.cloudController = function () {

        this.canvas2.addEventListener('mousemove', (e) => {
            switch (this.toolState) {
                case 'translate2':
                    if (this.mouse.down) this.translateGroup(e)
                    else if (this.mouse.rightDown) this.cameraMove(e)
                    break;
                case 'rotate2':
                    if (this.mouse.down) this.rotateGroup(e)
                    else if (this.mouse.rightDown) this.cameraMove(e)
                    break;
                case 'translate':
                    if (this.mouse.down) this.translateGroup(e)
                    else if (this.mouse.rightDown) this.cameraMove(e)
                    break;
                case 'rotate':
                    if (this.mouse.down) this.rotateGroup(e)
                    else if (this.mouse.rightDown) this.cameraMove(e)
                    break;
                case 'pencil':
                    if (this.mouse.down) this.drawPencil(e)
                    break;
                default:
            }
        }, false);

        this.canvas2.addEventListener('mousedown', (e) => {
            if (e.button == 0) {
                this.mouseDown(e);
                switch (this.toolState) {
                    case 'point':
                        this.addSelectedPoint(e)
                        break;
                    case 'polygon':
                        this.drawPolygon(e)
                        break;
                    case 'pencil':
                        this.startPencil(e)
                        break;
                    default:
                }
            }
            else if (e.button == 2) {
                this.mouseRightDown(e)
            }

        }, false);

        this.canvas2.addEventListener('mouseup', (e) => {
            if (e.button == 0) {
                this.mouseUp(e);
                switch (this.toolState) {
                    case 'pencil':
                        this.finishdraw(e)
                        break;
                }
            }
            else if (e.button == 2) {
                this.mouseRightUp(e)
            }

        }, false);

        this.canvas2.addEventListener('dblclick', (e) => {
            switch (this.toolState) {
                case 'polygon':
                    this.finishdraw(e)
                    break;
            }
        }, false);

        this.canvas2.addEventListener('mousewheel', (e) => {
            if (this.toolState == 'rotate' || this.toolState == 'rotate2' || this.toolState == 'translate' || this.toolState == 'translate2')
                this.mouseWheel(e);
        }, false);

        this.canvas2.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        })
    }

    this.getObjDataOf2D = function () {
        const exporter = new OBJExporter();
        let clone = this.group.children[1].clone();
        let array = clone.geometry.attributes.position.array;
        // for (var i = 2; i < array.length; i += 3) {
        //     array[i] += this.changedCloudZ;
        // }
        return exporter.parse(clone);
    }

    this.getObjDataOf3D = function () {
        const exporter = new OBJExporter();
        let clone = this.group.children[3].clone();
        let array = clone.geometry.attributes.position.array;
        // for (var i = 2; i < array.length; i += 3) {
        //     array[i] += this.changedCloudZ;
        // }
        return exporter.parse(clone);
    }

    this.getTextData = function (param = false, matrix = false) {
        let result = "";
        let array;
        if (!param) {
            array = this.group.children[0].geometry.attributes.position.array;
            for (let i = 0; i < array.length; i += 3) {
                result += `        ${array[i]},        ${array[i + 1]},        ${array[i + 2]}\n`;
                // result += `        ${array[i]},        ${array[i + 1]},        ${array[i + 2] + this.changedCloudZ}\n`;
            }
        } else {
            if (!matrix) {
                array = param;
                for (let i = 0; i < array.length; i += 3) {
                    result += `        ${array[i]},        ${array[i + 1]},        ${array[i + 2]}\n`;
                }
            }
            else {
                let m = new THREE.Matrix4().fromArray(matrix);
                for (let i = 0; i < param.length; i += 3) {
                    let v = new THREE.Vector3(parseFloat(param[i]), parseFloat(param[i + 1]), parseFloat(param[i + 2])).applyMatrix4(m)
                    result += `        ${v.x},        ${v.y},        ${v.z}\n`;
                }
            }
        }
        return result;
    }

    this.set2dMeshVisibility = function (v) {
        this.group.children[1].visible = v;
        this.render();
    }

    this.set3dMeshVisibility = function (v) {
        this.group.children[3].visible = v;
        this.render();
    }

    this.setMeshWireframe = function (v) {
        this.group.children[1].material.wireframe = v;
        this.group.children[3].material.wireframe = v;
        this.render();
    }

    this.setHeightMapColor = function (v) {
        this.setPointColor(v ? "#ffffff" : pointcolor())
        this.group.children[0].material.vertexColors = v;
        this.group.children[0].material.needsUpdate = true;
        this.group.children[1].material.vertexColors = v;
        this.group.children[1].material.needsUpdate = true;
        this.render();
    }

    this.setPointColor = function (c) {
        this.group.children[0].material.color.set(c);
        this.group.children[1].material.color.set(c);
        this.render();
    }

    this.setDelaunyColor = function (c) {
        this.group.children[3].material.color.set(c);
        this.render();
    }

    this.setSelectedSize = function (c) {
        this.group.children[2].material.size = c;
        this.group.children[2].material.needsUpdate = true;
        this.render();
    }

    this.setSelectedColor = function (c) {
        this.group.children[2].material.color.set(c);
        this.render();
    }

    this.setToolState = function (tool) {
        this.polygon = [];
        this.selectedCount = 0;
        this.unselectedPoints = [...this.group.children[0].geometry.attributes.position.array];
        console.log('unselected', this.unselectedPoints)
        this.selectedGroup.geometry.setDrawRange(0, this.selectedCount);
        this.render()
        this.polygonRender()
        this.toolState = tool;
    }

    this.setModelFromSelectedPoints = function () {
        if (this.selectedCount < 4) {
            alert("Delaunay 3D triangulation requires 4 or more points.")
            return;
        }

        let array = [...this.group.children[0].geometry.attributes.position.array];
        this.addToHistory(array);
        // this.addToHistory(array, this.changedCloudZ);

        let updatePoints = [];
        for (let i = 0; i < this.selectedCount; i++) {
            updatePoints.push(this.selectedPoints[i * 3], this.selectedPoints[i * 3 + 1], this.selectedPoints[i * 3 + 2])
        }

        this.polygon = [];
        this.selectedCount = 0;
        this.selectedGroup.geometry.setDrawRange(0, this.selectedCount);
        this.reloadModelFromArray(getCurrentFilename(), updatePoints, false);
        this.polygonRender()
    }

    this.changeBtnSU = function () {
        this.polygon = [];
        let unselec2 = [...this.unselectedPoints];
        this.unselectedPoints = [];
        for (let i = 0; i < this.selectedCount; i++) {
            this.unselectedPoints.push(this.selectedPoints[i * 3], this.selectedPoints[i * 3 + 1], this.selectedPoints[i * 3 + 2])
        }
        this.selectedCount = unselec2.length / 3;
        for (let i = 0; i < unselec2.length; i += 3) {
            this.selectedPoints[i] = unselec2[i];
            this.selectedPoints[i + 1] = unselec2[i + 1];
            this.selectedPoints[i + 2] = unselec2[i + 2];
        }
        this.selectedGroup.geometry.setDrawRange(0, this.selectedCount);
        this.selectedGroup.geometry.attributes.position.needsUpdate = true;
        this.render()
        this.polygonRender()
    }

    this.deleteSelectedPoints = function () {
        if (this.unselectedPoints.length < 12) {
            alert("Delaunay 3D triangulation requires 4 or more points.")
            return;
        }

        let array = [...this.group.children[0].geometry.attributes.position.array];
        this.addToHistory(array)

        this.polygon = [];
        this.selectedCount = 0;
        this.selectedGroup.geometry.setDrawRange(0, this.selectedCount);
        this.reloadModelFromArray(getCurrentFilename(), [...this.unselectedPoints], false);
        this.polygonRender()
    }

    this.windowResize = () => {
        this.polygon = [];
        this.camera.aspect = this.parent_canvas.clientWidth / this.parent_canvas.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize((this.parent_canvas.clientWidth - 30), this.parent_canvas.clientHeight);
        this.render()
        this.polygonRender()
    }

    this.gridMinimumFilter = function (cellSize) {
        this.polygon = [];
        let array = this.group.children[0].geometry.attributes.position.array;
        let filteredPoints = filters.gridMinimumFilter(cellSize, array)
        if (filteredPoints.length < 12) {
            alert("Delaunay 3D triangulation requires 4 or more points.")
            return;
        }
        this.addToHistory(array)
        this.reloadModelFromArray(getCurrentFilename(), filteredPoints, false)
        this.polygonRender()
    }

    this.voxelGridFilter = function (cellSize) {
        this.polygon = [];
        let array = this.group.children[0].geometry.attributes.position.array;
        let filteredPoints = filters.voxelGridFilter(cellSize, array)
        if (filteredPoints.length < 12) {
            alert("Delaunay 3D triangulation requires 4 or more points.")
            return;
        }
        this.addToHistory(array)
        this.reloadModelFromArray(getCurrentFilename(), filteredPoints, false)
        this.render()
        this.polygonRender()
    }

    this.outlierRemovalFilter = function (num, dev) {
        this.polygon = [];
        let array = this.group.children[0].geometry.attributes.position.array;
        let filteredPoints = filters.updatedRemovalFilter(num, dev, array)
        if (filteredPoints.length < 12) {
            alert("Delaunay 3D triangulation requires 4 or more points.")
            return;
        }
        this.addToHistory(array)
        this.reloadModelFromArray(getCurrentFilename(), filteredPoints, false)
        this.render()
        this.polygonRender()
    }

    this.passThroughFilter = function (pass, limit1, limit2) {
        this.polygon = [];
        let array = this.group.children[0].geometry.attributes.position.array;
        let filteredPoints = filters.passThroughFilter(pass, limit1, limit2, array)
        if (filteredPoints.length < 12) {
            alert("Delaunay 3D triangulation requires 4 or more points.")
            return;
        }
        this.addToHistory(array)
        this.reloadModelFromArray(getCurrentFilename(), filteredPoints, false)
        this.render()
        this.polygonRender()
    }

    this.popupHistory = function (e) {
        if (this.history.step > 0) {
            e.preventDefault();
            this.polygon = [];
            console.log('reloaded')
            this.reloadModelFromArray(getCurrentFilename(), this.history.data[this.history.step - 1], false)
            this.render()
            this.polygonRender()
            this.history.step--;
        }
    }

    this.getSavePoints = function () {
        let array = [...this.group.children[0].geometry.attributes.position.array];
        // for (let i = 2; i < array.length; i += 3) {
        //     array[i] += this.changedCloudZ;
        // }
        return array;
    }

    this.getSaveMatrixArray = function () {
        let result = this.sessionHistory[this.sessionHistory.length - 1].matrix;
        return [...result];
    }

    this.calculateVolume = function (h, v) {
        let sessionHistory = this.sessionHistory;
        let volume = Math.abs(this.getSelVolume(sessionHistory[h].data, sessionHistory[v].data));
        sessionHistory[h].volume = volume;
        return volume;
    }

    this.getSelVolume = function (heap, ground) {
        let { geometry, heapCvalue } = this.getIndexedGeom(heap);
        let sum2 = 0;
        let GT = 0;
        let p1 = new THREE.Vector3(),
            p2 = new THREE.Vector3(),
            p3 = new THREE.Vector3();

        for (let i = 2; i < ground.length; i += 3) {
            GT += parseFloat(ground[i]);
        }

        GT /= (ground.length / 3);
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
            if (p1.z > 0 && p2.z <= 0 && p3.z <= 0) result = this.e1Volume(p1, p2, p3);
            else if (p2.z > 0 && p1.z <= 0 && p3.z <= 0) result = this.e1Volume(p2, p1, p3);
            else if (p3.z > 0 && p1.z <= 0 && p2.z <= 0) result = this.e1Volume(p3, p1, p2);
            else if (p3.z >= 0 && p2.z >= 0 && p1.z < 0) result = this.e2Volume(p3, p2, p1);
            else if (p1.z >= 0 && p3.z >= 0 && p2.z < 0) result = this.e2Volume(p1, p3, p2);
            else if (p1.z >= 0 && p2.z >= 0 && p3.z < 0) result = this.e2Volume(p1, p2, p3);
            else if (p1.z >= 0 && p2.z >= 0 && p3.z >= 0) result = this.signedVolumeOfTriangle(p1, p2, p3);

            sum2 += result;
        }
        return sum2;
    }

    this.getIndexedGeom = function (array) {
        let points3d = [];
        for (let i = 0; i < array.length; i += 3) {
            points3d.push(new THREE.Vector3(parseFloat(array[i]), parseFloat(array[i + 1]), parseFloat(array[i + 2])));
        }
        let geometry = new THREE.BufferGeometry().setFromPoints(points3d);
        let heapCvalue = geometry.attributes.position.array[2];
        geometry.center();
        heapCvalue -= geometry.attributes.position.array[2];

        let indexDelaunay = Delaunator.from(
            points3d.map(v => {
                return [v.x, v.y];
            })
        );

        let meshIndex = []; // delaunay index => three.js index
        for (let i = 0; i < indexDelaunay.triangles.length; i++) {
            meshIndex.push(indexDelaunay.triangles[i]);
        }

        geometry.setIndex(meshIndex); // add three.js index to the existing geometry
        return { geometry, heapCvalue };
    }

    this.signedVolumeOfTriangle = function (p1, p2, p3) {
        let result = (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) * (p1.z + p2.z + p3.z) / 6.0;
        return Math.abs(result);
    }

    this.e1Volume = function (p1, p2, p3) {
        let q = new THREE.Vector3().copy(p1);
        let w = new THREE.Vector3();
        let e = new THREE.Vector3();
        w.x = p2.x - (p2.z / (p2.z - p1.z) * (p2.x - p1.x));
        w.y = p2.y - (p2.z / (p2.z - p1.z) * (p2.y - p1.y));
        w.z = 0;
        e.x = p3.x - (p3.z / (p3.z - p1.z) * (p3.x - p1.x));
        e.y = p3.y - (p3.z / (p3.z - p1.z) * (p3.y - p1.y));
        e.z = 0;
        return this.signedVolumeOfTriangle(q, w, e)
    }

    this.e2Volume = function (p1, p2, p3) {
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
        return this.signedVolumeOfTriangle(q, e, r) + this.signedVolumeOfTriangle(new THREE.Vector3().copy(w), new THREE.Vector3().copy(e), new THREE.Vector3().copy(r))
    }

    this.preview = function (id, parent) {
        let canvas = document.getElementById(id);
        let parentDiv = document.getElementById(parent);
        this.renderer2 = new THREE.WebGLRenderer({ canvas, alpha: true });
        this.renderer2.setPixelRatio(window.devicePixelRatio);
        console.log({ parentDiv }, { canvas })
        let w = canvas.clientWidth;
        let h = canvas.clientHeight;
        console.log(w, h)
        this.renderer2.setSize(w, h, false);
    }

    this.previewCloud = function (id, data) {
        // return;
        let elem = document.querySelector('#' + id);
        let scene = new THREE.Scene();
        let camera = new THREE.PerspectiveCamera(60, elem.clientWidth / elem.clientHeight, 0.01, 1000);

        var light = new THREE.DirectionalLight(0xffffff, 1.5);
        light.position.set(0, 0, 56);
        scene.add(light);
        scene.add(new THREE.AmbientLight(0xffffff, 0.5));


        camera.position.set(0, -20, 6);
        camera.lookAt(0, 0, 0);
        // camera.aspect = rect.width / rect.height;
        // camera.updateProjectionMatrix();

        scene.add(camera);
        scene.background = new THREE.Color(0x999999);

        let colors = [];
        let points3d = [];
        let values = getminmaxhegihtfromarray(data);
        let min = values[0];
        let max = values[1];

        for (let i = 0; i < data.length; i += 3) {
            points3d.push(new THREE.Vector3(parseFloat(data[i]), parseFloat(data[i + 1]), parseFloat(data[i + 2])));

            let zvalue = parseFloat(data[i + 2]);
            let k = (zvalue - min) / (max - min);
            let rgb = getrgb(k);
            //set color from xyz
            colors.push(rgb[0]);
            colors.push(rgb[1]);
            colors.push(rgb[2]);
        }

        let geometry = new THREE.BufferGeometry().setFromPoints(points3d);

        if (colors.length > 0) {
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        }

        geometry.center();

        let material;
        material = new THREE.PointsMaterial({ size: 0.1, vertexColors: true });

        let points2 = new THREE.Points(geometry, material);
        scene.add(points2);


        const renderer = this.renderer2;
        console.log({ elem }, { rect: this.canvas.getBoundingClientRect() })
        const rect = elem.getBoundingClientRect();
        const { left, right, top, bottom, width, height } = rect;

        const isOffscreen =
            bottom < 0 || top > renderer.domElement.clientHeight ||
            right < 0 || left > renderer.domElement.clientWidth;

        if (!isOffscreen) {
            const positiveYUpBottom = renderer.domElement.clientHeight - bottom;
            renderer.setScissor(left, positiveYUpBottom, width, height);
            renderer.setViewport(left, positiveYUpBottom, width, height);
            console.log('rendered', left, positiveYUpBottom, width, height, rect)
            renderer.render(scene, camera);;
        }
    }
}



////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

function selectedcolor() {
    return document.getElementById('selectedcolor').value;
}

function selectedsize() {
    return document.getElementById('selectedsize').value;
}

function polygoncolor() {
    return document.getElementById('polygoncolor').value;
}

function polygonsize() {
    return document.getElementById('polygonsize').value;
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

function getCurrentFilename() {
    return document.getElementById('modelpath').innerText;
}