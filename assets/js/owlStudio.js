import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { OBJLoader } from './OBJLoader.js';
import Delaunator from './delaunator.js';
import { OBJExporter } from './OBJExporter.js';
import { ConvexGeometry } from './ConvexGeometry.js';
import { XYZLoader, getminmaxhegiht, getminmaxhegihtfromarray, getminmaxheightfromjson, getrgb, init_highlow } from './XYZLoader.js';

import * as filters from './filters.js';

let gid = 0;
// console.log($.toast)
export const owlStudio = function (cv1, cv2, parent) {

    this.canvas = document.getElementById(cv1);

    this.canvas2 = document.getElementById(cv2);

    this.parent_canvas = document.getElementById(parent);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, preserveDrawingBuffer: true });

    this.scene = new THREE.Scene();

    this.oscene = new THREE.Object3D();

    this.camera = new THREE.PerspectiveCamera(60, this.canvas.clientWidth / this.canvas.clientHeight, 0.01, 1000);

    this.cameraLookAt = new THREE.Vector3();

    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    this.cplanes = [
        new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.5),
        new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.5)
    ];

    // this.planeHelpers = this.cplanes.map(p => new THREE.PlaneHelper(p, 20, 0xffffff));

    this.mouse = {
        target: new THREE.Vector2(),
        down: false,
        rightDown: false,
        x: 0,
        y: 0,
    };

    this.polygon = [];

    this.sessionHistory = [];

    this.toolState = 'rotate';

    this.drawState = false;

    this.transDir = 'xy';

    this.groupList = [];

    this.activeId = [];

    // this.target;

    // this.multiGroup = {
    //     list: [],
    //     group: new THREE.Object3D(),
    //     changePosition: { x: 0, y: 0, z: 0 },
    //     position: new THREE.Vector3(),
    //     quaternion: new THREE.Quaternion(),
    //     rotatePosition: { x: 0, y: 0, z: 0 },
    // };

    this.init = function () {

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        // this.renderer.localClippingEnabled = true;

        this.camera.position.set(0, -20, 6);
        this.camera.lookAt(0, 0, 0);

        var light = new THREE.DirectionalLight(0xffffff, 1.5);

        light.position.set(0, 0, 56);

        this.scene.add(light);
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        // this.scene.add(this.camera);
        this.scene.add(this.oscene)
        // this.scene.add(this.multiGroup.group)

        this.scene.background = new THREE.Color(0x111111);

        this.setGlobalCoordinate();



        // controls.addEventListener('change', render); // call this only in static scenes (i.e., if there is no animation loop)
        // controls.minDistance = 0.1;
        // controls.maxDistance = 100;
        // // controls.enableRotate = true;
        // controls.maxPolarAngle = Infinity;
        // controls.enableRotate = false;

        // //set axis
        // var axes = new THREE.AxesHelper(50);
        // this.scene.add(axes);
        // //set grid helper
        // var gridXZ = new THREE.GridHelper(0, 0);
        // this.scene.add(gridXZ);

        // var gridXY = new THREE.GridHelper(60, 120);
        // gridXY.rotation.x = Math.PI / 2;
        // this.scene.add(gridXY);

        // var gridYZ = new THREE.GridHelper(30, 60);
        // gridYZ.rotation.z = Math.PI / 2;
        // this.scene.add(gridYZ);

        window.addEventListener('resize', this.windowResize);

    }

    this.addToHistory = function (history, data) {

        history.data[history.step] = data;

        history.step++;

    }

    this.addToSessionHistory = function (filename, type, arrayData, matrixElem, version, id) {

        this.sessionHistory.push({
            name: filename + '_v' + version,
            date: getDate(),
            time: getTime(),
            type: type,
            data: arrayData,
            matrix: matrixElem,
            id: id,
            filename: filename,
        })

    }

    this.reloadModelFromData = function (filename, data) {

        this.initDraw()
        this.initSelectedPoints()

        let lines = data.split('\n');

        let arrayData = [];

        for (let line of lines) {

            line = line.trim();

            if (line.charAt(0) === '#') continue; // skip comments

            let lineValues = line.split(/\s+/);

            if (lineValues.length === 3) {
                // XYZ
                arrayData.push(parseFloat(lineValues[0]), parseFloat(lineValues[1]), parseFloat(lineValues[2]));

            }

        }

        this.reloadModelFromArray(filename, arrayData)

    }

    this.reloadModelFromJSONData = function (filename, data) {

        this.initDraw()
        this.initSelectedPoints()

        let arrayData = [];

        data.forEach(function (xyz) {

            arrayData.push(parseFloat(xyz.x), parseFloat(xyz.y), parseFloat(xyz.z));

        });

        this.reloadModelFromArray(filename, arrayData)

    }

    this.reloadModelFromObjData = function (filename, data) {

        this.initDraw()
        this.initSelectedPoints()

        let loader = new OBJLoader();

        let arrayData = [];

        arrayData = [...loader.parse(data).children[0].geometry.attributes.position.array];

        this.reloadModelFromArray(filename, arrayData)


        // // ///////////////////////////////////////////////
        // let target = this.CustomPointCloud(filename)
        // target.name = "asdf";
        // target.group.add(loader.parse(data))
        // this.scene.add(target.group)
        // ///////////////////////////////////////////////
    }

    this.reloadModelFromArray = function (filename, arrayData, newModel = 'new') {

        // $("#modelpath").text(filename);

        let target;

        if (newModel == 'new') {
            console.log('new')

            target = this.CustomPointCloud(filename);

            let xyz = this.customCenter(arrayData)

            target.group.position.copy(xyz)

            target.position.copy(xyz);

            target.matrix = [...new THREE.Matrix4().setPosition(target.position).elements];

            this.setCameraPosition(new THREE.Vector3(xyz.x,xyz.y,xyz.z).applyMatrix4(this.oscene.matrix));

            this.oscene.add(target.group)

        } else if (Array.isArray(newModel)) {
            console.log('history or database')

            newModel = newModel.map((e) => {
                return parseFloat(e);
            })

            target = this.CustomPointCloud(filename);//it is history or database model

            target.group.matrix.fromArray(newModel)

            target.group.position.setFromMatrixPosition(target.group.matrix);

            target.group.quaternion.setFromRotationMatrix(target.group.matrix)

            target.matrix = [...newModel];

            target.position.copy(target.group.position)

            target.quaternion.copy(target.group.quaternion)

            this.setCameraPosition(new THREE.Vector3().copy(target.group.position).applyMatrix4(this.oscene.matrix));

            this.oscene.add(target.group)

        } else if (Array.isArray(arrayData)) {
            console.log('targetted!!!')
            target = this.groupList[newModel];

            if (target.group.children.length > 0) {

                target.group.clear();

            }

        } else {
            console.log('pointTopointreturned')
            target = this.groupList[newModel];

            if (arrayData.position) {
                target.group.position.copy(arrayData.position)
            }
            this.render()
            return;
        }


        // this.cplanes[0].set(new THREE.Vector3(0, -1, 0), target.group.position.y + 2)
        // this.cplanes[1].set(new THREE.Vector3(0, 1, 0), -target.group.position.y + 2)

        let colors = [];

        let points3d = [];

        let values = getminmaxhegihtfromarray(arrayData);

        let min = values[0];
        let max = values[1];

        for (let i = 0; i < arrayData.length; i += 3) {

            points3d.push(new THREE.Vector3(parseFloat(arrayData[i]), parseFloat(arrayData[i + 1]), parseFloat(arrayData[i + 2])));

            let zvalue = parseFloat(arrayData[i + 2]);

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

        let material;

        if (heightmapColor()) {

            document.getElementById('pointcolor').disabled = true;

            material = new THREE.PointsMaterial({ size: pointsize(), vertexColors: true, clippingPlanes: this.cplanes, color: "#ffffff" });

        } else
            material = new THREE.PointsMaterial({ size: pointsize(), vertexColors: false, clippingPlanes: this.cplanes, color: pointcolor() });

        let points2 = new THREE.Points(geometry, material);

        target.group.add(points2);
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
            new THREE.MeshLambertMaterial({ color: heightmapColor() ? "#ffffff" : pointcolor(), wireframe: surface(), clippingPlanes: this.cplanes, side: THREE.DoubleSide, vertexColors: heightmapColor(), })
        );

        mesh.visible = delauny();

        target.group.add(mesh);

        //selected points
        target.unselectedPoints = [...geometry.attributes.position.array];

        target.selectedPoints = new Float32Array(geometry.index.count * 3);

        let geometry3 = new THREE.BufferGeometry();

        geometry3.setAttribute('position', new THREE.BufferAttribute(target.selectedPoints, 3));

        geometry3.setDrawRange(0, 0)

        target.selectedCount = 0;

        let material3 = new THREE.PointsMaterial({
            color: selectedcolor(),
            size: selectedsize(),

        });

        target.selectedGroup = new THREE.Points(geometry3, material3);
        target.selectedGroup.frustumCulled = false;

        target.group.add(target.selectedGroup);

        //3d delauny
        let geometry5 = new ConvexGeometry(points3d);

        geometry5.computeBoundingSphere();

        let mesh5 = new THREE.Mesh(
            geometry5,
            new THREE.MeshLambertMaterial({ color: delaunycolor(), wireframe: surface(), clippingPlanes: this.cplanes, side: THREE.DoubleSide, })
        );

        mesh5.visible = delauny3();

        target.group.add(mesh5);

        //set axis helper
        var axes = new THREE.AxesHelper(5);

        target.group.add(axes);
        // //set grid helper
        // var gridXZ = new THREE.GridHelper(0, 0);
        // target.group.add(gridXZ);

        // var gridXY = new THREE.GridHelper(30, 60);
        // gridXY.rotation.x = Math.PI / 2;
        // target.group.add(gridXY);

        // var gridYZ = new THREE.GridHelper(30, 60);
        // gridYZ.rotation.z = Math.PI / 2;
        // target.group.add(gridYZ);
        if (!coordinate()) {

            axes.visible = false;

        }

        this.listViewEngine(this.groupList, this.activeId)

        this.render();

        this.addToSessionHistory(filename, 'model', [...geometry.attributes.position.array], [...target.matrix], ++target.version, target.id);

    }

    this.reloadGroundFromData = function (filename, data) {

        let lines = data.split('\n');

        let count = 0;

        let saveData = [];

        let x = 0, y = 0, z = 0;

        for (let line of lines) {

            line = line.trim();

            if (line.charAt(0) === '#') continue; // skip comments

            let lineValues = line.split(/\s+/);

            if (lineValues.length === 3) {

                let xx = parseFloat(lineValues[0]);
                let yy = parseFloat(lineValues[1]);
                let zz = parseFloat(lineValues[2]);

                saveData.push(xx, yy, zz)

                x += xx;
                y += yy;
                z += zz;

                count++;

            }

        }

        x /= count;
        y /= count;
        z /= count;

        for (let i = 0; i < saveData.length; i += 3) {

            saveData[i] -= x;
            saveData[i + 1] -= y;
            saveData[i + 2] -= z;

        }

        this.addToSessionHistory(filename, 'ground', saveData, new THREE.Matrix4().setPosition(x, y, z).elements, 1, ++gid)

    }

    this.render = function () {

        this.renderer.render(this.scene, this.camera);

    }

    this.setCurrentMatrix = function () {

        for (let id of this.activeId) {

            let target = this.groupList[id];

            target.rotatePosition = { x: target.changePosition.x, y: target.changePosition.y, z: target.changePosition.z }

            target.quaternion.copy(target.group.quaternion)

            target.position.copy(target.group.position)

            target.matrix = [...target.group.matrix.elements];

            this.addToSessionHistory(target.name, 'model', [...target.group.children[0].geometry.attributes.position.array], [...target.matrix], ++target.version, target.id);

        }

    }

    this.setMatrixToHistory = function (id, array) {

        this.sessionHistory[id].matrix = [...array];

    }

    this.setFromRealMatrix = function () {

        this.groupList.map((target) => {

            let { x, y, z } = target.rotatePosition;

            target.group.children[0].geometry.translate(x - target.changePosition.x, y - target.changePosition.y, z - target.changePosition.z)
            target.group.children[3].geometry.translate(x - target.changePosition.x, y - target.changePosition.y, z - target.changePosition.z)

            target.changePosition.x = x;
            target.changePosition.y = y;
            target.changePosition.z = z;

            target.group.position.copy(target.position)
            target.group.quaternion.copy(target.quaternion)
            target.group.matrix.fromArray(target.matrix)

        })

        this.initDraw();
        this.initSelectedPoints();
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
            // console.log(polygon)
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = width;

            ctx.beginPath();

            ctx.moveTo(polygon[0][0], polygon[0][1]);

            ctx.arc(polygon[0][0], polygon[0][1], 1, 0, 2 * Math.PI);

            for (let i = 1; i < polygon.length; i++) {

                ctx.lineTo(polygon[i][0], polygon[i][1]);

            }

            if (!this.drawState) ctx.closePath();

            ctx.stroke();

        }
        if (this.birdEyePlane) {
            let n = 12;
            let cell = this.canvas2.width / 13;
            let m = Math.round(this.canvas.height / cell - 1);

            ctx.strokeStyle = polygoncolor();
            ctx.lineWidth = 1;
            console.log(n, m)
            for (let i = 1; i <= n; i++) {
                ctx.moveTo(i * cell, 0);
                ctx.lineTo(i * cell, this.canvas2.height);
            }
            for (let i = 1; i <= m; i++) {
                ctx.moveTo(0, i * cell);
                ctx.lineTo(this.canvas2.width, i * cell);
            }
            ctx.stroke();
        }

    }

    this.rotateGroup = (evt) => {

        let deltaX = evt.clientX - this.mouse.x,
            deltaY = evt.clientY - this.mouse.y;

        this.mouse.x = evt.clientX;
        this.mouse.y = evt.clientY;

        if (!this.gcs || !this.gcs.visible) {

            for (let id of this.activeId) {

                let target = this.groupList[id];

                target.group.rotation.z += deltaX / 100;
                target.group.rotation.x += deltaY / 100;

            }

        } else {

            let gp = new THREE.Vector3().copy(this.gcs.position)
            let gm = new THREE.Matrix4().copy(this.gcs.matrix)
            let gq = new THREE.Quaternion().setFromRotationMatrix(gm)
            gq.x = -gq.x; gq.y = -gq.y; gq.z = -gq.z;

            this.gcs.rotation.z += deltaX / 100;
            this.gcs.rotation.x += deltaY / 100;
            gm.makeRotationFromEuler(this.gcs.rotation)
            let guq = new THREE.Quaternion().setFromRotationMatrix(gm);

            this.oscene.position.sub(gp);
            this.oscene.position.applyQuaternion(gq)
            this.oscene.position.applyQuaternion(guq)

            this.oscene.applyQuaternion(gq)
            this.oscene.applyQuaternion(guq)


            this.oscene.position.add(gp)

            // for (let target of this.groupList) {

            //     let group = target.group;
            //     group.position.sub(gp);
            //     group.position.applyQuaternion(gq)
            //     group.position.applyQuaternion(guq)

            //     group.applyQuaternion(gq)
            //     group.applyQuaternion(guq)


            //     group.position.add(gp)
            //     // console.log(group.position)

            // }

            if (this.clipGrid) {
                let { normal, normal2, constant, position } = this.localClip;
                let grid = this.clipGrid;
                grid.position.copy(position)
                grid.position.sub(gp);
                grid.position.applyQuaternion(gq)
                grid.position.applyQuaternion(guq)
                grid.applyQuaternion(gq)
                grid.applyQuaternion(guq)
                grid.position.add(gp)

                let ctr = grid.position;

                normal.applyQuaternion(gq)
                normal.applyQuaternion(guq).normalize()
                normal2.applyQuaternion(gq)
                normal2.applyQuaternion(guq).normalize()

                constant = -(normal.x * ctr.x + normal.y * ctr.y + normal.z * ctr.z);
                position = new THREE.Vector3().copy(ctr)
                this.localClip = { normal, normal2, constant, position };
                this.updateCrossSection()

                for (let target of this.clipPoints) {
                    target.sub(gp);
                    target.applyQuaternion(gq)
                    target.applyQuaternion(guq)
                    target.add(gp)
                }
            }

        }

        this.render()

    }

    this.translateGroup = (evt) => {

        let deltaX = evt.clientX - this.mouse.x,
            deltaY = evt.clientY - this.mouse.y;

        this.mouse.x = evt.clientX;
        this.mouse.y = evt.clientY;
        let id1 = this.transDir[0];
        let id2 = this.transDir[1];

        if (!this.gcs || !this.gcs.visible) {

            for (let id of this.activeId) {

                let target = this.groupList[id];

                target.group.position[id1] += deltaX / 100;
                target.group.position[id2] -= deltaY / 100;

            }

        } else {

            for (let target of this.groupList) {

                target.group.position[id1] += deltaX / 100;
                target.group.position[id2] -= deltaY / 100;

            }

        }

        this.render()

    }

    this.rotateAbs = (axis, degree) => {

        let x = 0, y = 0, z = 0;
        degree = parseFloat(degree)
        isNaN(degree) && (degree = 0);
        if (axis == 'x') {

            x = degree;

        } else if (axis == 'y') {

            y = degree;

        } else if (axis == 'z') {

            z = degree;

        }

        for (let id of this.activeId) {

            let target = this.groupList[id];

            target.group.rotation.x += x;
            target.group.rotation.y += y;
            target.group.rotation.z += z;

        }

        this.render()

    }

    this.translateAbs = (x, y, z) => {

        x = parseFloat(x)
        y = parseFloat(y)
        z = parseFloat(z)
        isNaN(x) && (x = 0);
        isNaN(y) && (y = 0);
        isNaN(z) && (z = 0);

        for (let id of this.activeId) {

            let target = this.groupList[id];

            target.group.position.x += x;
            target.group.position.y += y;
            target.group.position.z += z;

        }

        this.render()

    }

    this.cameraMove = (evt) => {

        let deltaX = evt.clientX - this.mouse.x,
            deltaY = evt.clientY - this.mouse.y;

        this.mouse.x = evt.clientX;
        this.mouse.y = evt.clientY;

        let normal = new THREE.Vector3(this.cameraLookAt.x - this.camera.position.x, this.cameraLookAt.y - this.camera.position.y, this.cameraLookAt.z - this.camera.position.z).normalize()
        let op = new THREE.Vector3().copy(this.camera.position)
        let p = this.camera.position;

        let quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), normal);
        p.add(new THREE.Vector3(-deltaX / 35, 0, -deltaY / 35).applyQuaternion(quaternion))

        this.cameraLookAt.x += p.x - op.x;
        this.cameraLookAt.y += p.y - op.y;
        this.cameraLookAt.z += p.z - op.z;

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

    this.setCameraPosition = (v) => {

        let x = v.x;
        let y = v.y;
        let z = v.z;

        this.camera.position.x = x;
        this.camera.position.y = y - 20;
        this.camera.position.z = z + 6;

        this.cameraLookAt.x = x;
        this.cameraLookAt.y = y;
        this.cameraLookAt.z = z;

        this.camera.lookAt(this.cameraLookAt);

    }

    this.setCameraFromT = (position, lookAt) => {
        let x = position.x;
        let y = position.y;
        let z = position.z;

        this.camera.position.x = x;
        this.camera.position.y = y;
        this.camera.position.z = z;

        this.cameraLookAt.x = lookAt.x;
        this.cameraLookAt.y = lookAt.y;
        this.cameraLookAt.z = lookAt.z;

        this.camera.lookAt(this.cameraLookAt);
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

        // if (this.toolState == "addpoint") {

        let normal = new THREE.Vector3(this.cameraLookAt.x - this.camera.position.x, this.cameraLookAt.y - this.camera.position.y, this.cameraLookAt.z - this.camera.position.z).normalize()
        this.camera.position.x -= event.deltaY / 100 * normal.x;
        this.camera.position.y -= event.deltaY / 100 * normal.y;
        this.camera.position.z -= event.deltaY / 100 * normal.z;

        this.cameraLookAt.x -= event.deltaY / 100 * normal.x;
        this.cameraLookAt.y -= event.deltaY / 100 * normal.y;
        this.cameraLookAt.z -= event.deltaY / 100 * normal.z;
        // return;
        // }

        // this.camera.position.y -= event.deltaY / 100;
        // this.camera.position.z += event.deltaY / 100 * 3 / 10;

        // this.cameraLookAt.y -= event.deltaY / 100;
        // this.cameraLookAt.z += event.deltaY / 100 * 3 / 10;

        this.camera.lookAt(this.cameraLookAt);

        this.render()

    }

    this.addSelectedPoint = function (evt) {

        this.mouse.target.x = (evt.offsetX / this.canvas.clientWidth) * 2 - 1;
        this.mouse.target.y = - (evt.offsetY / this.canvas.clientHeight) * 2 + 1;

        let raycaster = new THREE.Raycaster();

        raycaster.setFromCamera(this.mouse.target, this.camera);

        let pointOnPlane = new THREE.Vector3();

        let point = new THREE.Vector3();

        if (this.activeId.length < 1) return;

        // for (let id of this.activeId) {

        // let target = this.groupList[id];
        let target = this.groupList[this.activeId[0]];

        let group = target.group;

        if (target.group.children[0]) {

            if (evt.ctrlKey && target.selectedCount > 0) {

                let geometry = target.selectedGroup.geometry;

                let position = geometry.attributes.position;

                let minDistance = Infinity;

                let dind = 0;

                let lop = target.selectedCount;

                target.selectedCount = 0;

                for (let i = 0; i < lop; i++) {

                    pointOnPlane.copy(new THREE.Vector3(position.array[i * 3], position.array[i * 3 + 1], position.array[i * 3 + 2]))

                    raycaster.ray.closestPointToPoint(new THREE.Vector3().copy(pointOnPlane).applyMatrix4(target.group.matrix).applyMatrix4(this.oscene.matrix), point)

                    let distanceSq = new THREE.Vector3().copy(pointOnPlane).applyMatrix4(target.group.matrix).applyMatrix4(this.oscene.matrix).distanceToSquared(point);

                    if (distanceSq < minDistance) {

                        minDistance = distanceSq;

                        dind = i;

                    }

                }

                let newpoints = [...target.selectedPoints];

                for (let i = 0; i < lop; i++) {

                    if (i !== dind) {

                        target.selectedPoints[target.selectedCount * 3 + 0] = newpoints[i * 3];
                        target.selectedPoints[target.selectedCount * 3 + 1] = newpoints[i * 3 + 1];
                        target.selectedPoints[target.selectedCount * 3 + 2] = newpoints[i * 3 + 2];

                        target.selectedCount++;

                    } else {

                        target.unselectedPoints.push(newpoints[i * 3], newpoints[i * 3 + 1], newpoints[i * 3 + 2])

                    }

                }

                target.selectedGroup.geometry.setDrawRange(0, target.selectedCount);

                target.selectedGroup.geometry.attributes.position.needsUpdate = true;

            } else if (evt.shiftKey) {

                let minDistance = Infinity;

                let sind;

                let closestPoint = new THREE.Vector3();

                let unselectedPoints = target.unselectedPoints;

                for (let i = 0; i < unselectedPoints.length; i += 3) {

                    raycaster.ray.closestPointToPoint(new THREE.Vector3(unselectedPoints[i], unselectedPoints[i + 1], unselectedPoints[i + 2]).applyMatrix4(target.group.matrix).applyMatrix4(this.oscene.matrix), point)

                    let distanceSq = new THREE.Vector3(unselectedPoints[i], unselectedPoints[i + 1], unselectedPoints[i + 2]).applyMatrix4(target.group.matrix).applyMatrix4(this.oscene.matrix).distanceToSquared(point);

                    if (distanceSq < minDistance) {

                        closestPoint.set(unselectedPoints[i], unselectedPoints[i + 1], unselectedPoints[i + 2]);

                        minDistance = distanceSq;

                        sind = i;

                    }

                }

                let unclonep = [...target.unselectedPoints];

                target.unselectedPoints = [];

                for (let i = 0; i < unclonep.length; i += 3) {

                    if (i != sind) target.unselectedPoints.push(unclonep[i], unclonep[i + 1], unclonep[i + 2])

                }

                target.selectedPoints[target.selectedCount * 3 + 0] = closestPoint.x;
                target.selectedPoints[target.selectedCount * 3 + 1] = closestPoint.y;
                target.selectedPoints[target.selectedCount * 3 + 2] = closestPoint.z;

                target.selectedCount++;

                target.selectedGroup.geometry.setDrawRange(0, target.selectedCount);

                target.selectedGroup.geometry.attributes.position.needsUpdate = true;

            } else {

                let array = group.children[0].geometry.attributes.position.array;

                let minDistance = Infinity;

                let sind;

                let closestPoint = new THREE.Vector3();

                for (let i = 0; i < array.length; i += 3) {

                    raycaster.ray.closestPointToPoint(new THREE.Vector3(array[i], array[i + 1], array[i + 2]).applyMatrix4(target.group.matrix).applyMatrix4(this.oscene.matrix), point)

                    let distanceSq = new THREE.Vector3(array[i], array[i + 1], array[i + 2]).applyMatrix4(target.group.matrix).applyMatrix4(this.oscene.matrix).distanceToSquared(point);

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

                target.unselectedPoints = unclonep;

                target.selectedPoints[0] = closestPoint.x;
                target.selectedPoints[1] = closestPoint.y;
                target.selectedPoints[2] = closestPoint.z;

                target.selectedCount = 1;

                target.selectedGroup.geometry.setDrawRange(0, target.selectedCount);

                target.selectedGroup.geometry.attributes.position.needsUpdate = true;

            }

        }
        // }

        this.render()

    }

    this.drawPencil = (evt) => {

        this.polygon.push([evt.offsetX, evt.offsetY])

        this.polygonRender()

    }

    this.startPencil = () => {

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


    this.getClosestPointOfActive = function(evt){
        this.mouse.target.x = (evt.offsetX / this.canvas.clientWidth) * 2 - 1;
        this.mouse.target.y = - (evt.offsetY / this.canvas.clientHeight) * 2 + 1;

        let raycaster = new THREE.Raycaster();

        raycaster.setFromCamera(this.mouse.target, this.camera);

        let point = new THREE.Vector3();

        let minDistance = Infinity;

        let sind;

        let closestPoint = new THREE.Vector3();

        for (let id of this.activeId) {

            let target = this.groupList[id];

            let group = target.group;

            let array = group.children[0].geometry.attributes.position.array;

            for (let i = 0; i < array.length; i += 3) {

                raycaster.ray.closestPointToPoint(new THREE.Vector3(array[i], array[i + 1], array[i + 2]).applyMatrix4(target.group.matrix).applyMatrix4(this.oscene.matrix), point)

                let distanceSq = new THREE.Vector3(array[i], array[i + 1], array[i + 2]).applyMatrix4(target.group.matrix).applyMatrix4(this.oscene.matrix).distanceToSquared(point);

                if (distanceSq < minDistance) {

                    closestPoint.set(array[i], array[i + 1], array[i + 2]);

                    minDistance = distanceSq;

                    sind = [id, i];

                }

            }

        }

        let array = this.groupList[sind[0]].group.children[0].geometry.attributes.position.array;

        let x = array[sind[1]];
        let y = array[sind[1] + 1];
        let z = array[sind[1] + 2];
        let rdata = {
            point:new THREE.Vector3(x,y,z),
            id:sind[0],
            gpoint:new THREE.Vector3(x,y,z).applyMatrix4(this.groupList[sind[0]].group.matrix).applyMatrix4(this.oscene.matrix)
        }
        return(rdata)
    }

    this.getClosestPointOfCloud = function(evt){
        this.mouse.target.x = (evt.offsetX / this.canvas.clientWidth) * 2 - 1;
        this.mouse.target.y = - (evt.offsetY / this.canvas.clientHeight) * 2 + 1;

        let raycaster = new THREE.Raycaster();

        raycaster.setFromCamera(this.mouse.target, this.camera);

        let point = new THREE.Vector3();

        let minDistance = Infinity;

        let sind;

        let closestPoint = new THREE.Vector3();

        for (let id = 0; id < this.groupList.length; id++ ) {

            let target = this.groupList[id];

            let group = target.group;

            if(!group.visible) continue;

            let array = group.children[0].geometry.attributes.position.array;

            for (let i = 0; i < array.length; i += 3) {

                raycaster.ray.closestPointToPoint(new THREE.Vector3(array[i], array[i + 1], array[i + 2]).applyMatrix4(target.group.matrix).applyMatrix4(this.oscene.matrix), point)

                let distanceSq = new THREE.Vector3(array[i], array[i + 1], array[i + 2]).applyMatrix4(target.group.matrix).applyMatrix4(this.oscene.matrix).distanceToSquared(point);

                if (distanceSq < minDistance) {

                    closestPoint.set(array[i], array[i + 1], array[i + 2]);

                    minDistance = distanceSq;

                    sind = [id, i];

                }

            }

        }

        let array = this.groupList[sind[0]].group.children[0].geometry.attributes.position.array;

        let x = array[sind[1]];
        let y = array[sind[1] + 1];
        let z = array[sind[1] + 2];
        let rdata = {
            point:new THREE.Vector3(x,y,z),
            id:sind[0],
            gpoint:new THREE.Vector3(x,y,z).applyMatrix4(this.groupList[sind[0]].group.matrix).applyMatrix4(this.oscene.matrix)
        }
        return(rdata)
    }

    this.setRotatePosition = function (evt) {

        let rdata = this.getClosestPointOfActive(evt)
        let vector = rdata.gpoint;
        let v2 = rdata.point;

        if (!this.gcs || !this.gcs.visible) {
            for (let id of this.activeId) {

                let target = this.groupList[id];

                let om = target.group.matrix;

                let p = new THREE.Vector3().setFromMatrixPosition(om)
                let q = new THREE.Quaternion().setFromRotationMatrix(om)
                q.x = -q.x; q.y = -q.y; q.z = -q.z;

                let op = new THREE.Vector3().setFromMatrixPosition(this.oscene.matrix)
                let oq = new THREE.Quaternion().setFromRotationMatrix(this.oscene.matrix)
                oq.x = -oq.x; oq.y = -oq.y; oq.z = -oq.z;

                let v = new THREE.Vector3().copy(vector).sub(op).applyQuaternion(oq).sub(p).applyQuaternion(q);

                target.group.children[0].geometry.translate(-v.x, -v.y, -v.z)
                target.group.children[3].geometry.translate(-v.x, -v.y, -v.z)

                target.changePosition.x -= v.x;
                target.changePosition.y -= v.y;
                target.changePosition.z -= v.z;

                let v3 = new THREE.Vector3().copy(v2).applyMatrix4(target.group.matrix);
                target.group.position.x = v3.x;
                target.group.position.y = v3.y;
                target.group.position.z = v3.z;

            }
        } else {
            this.gcs.position.copy(vector);
            // this.gcs.rotation.copy(new THREE.Euler())
        }


        this.render();

        backToRotateMode(this.toolState)

    }

    this.translateByLine = (evt) => {

        let rdata = this.getClosestPointOfCloud(evt)

        let vector = rdata.point;

        let matrix = this.groupList[rdata.id].group.matrix;
        
        this.linePdata = { vector: new THREE.Vector3().copy(vector), matrix }
        
        // let ovector = new THREE.Vector3().copy(vector).applyMatrix4(matrix)
        vector.applyMatrix4(matrix)
        
        if (!this.line) {

            let geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3()]);

            let material;
            material = new THREE.PointsMaterial({ size: selectedsize(), vertexColors: false, color: selectedcolor() });

            let points = new THREE.Points(geometry, material);
            points.frustumCulled = false;

            this.line = new THREE.Object3D().add(points);

            this.line.position.copy(vector)

            this.oscene.add(this.line);

        } else if (!this.line.visible) {

            this.line.position.copy(vector)
            this.line.visible = true;

        } else {

            let v = this.line.position;
            let tx = vector.x - v.x;
            let ty = vector.y - v.y;
            let tz = vector.z - v.z;

            if (tx == 0 && ty == 0 && tz == 0) {
                return;
            }

            for (let id of this.activeId) {

                let target = this.groupList[id];

                this.addToHistory(target.history, { position: new THREE.Vector3().copy(target.group.position) })

                target.group.position.x += tx;
                target.group.position.y += ty;
                target.group.position.z += tz;

            }

            this.line.visible = false;

        }

        this.render()

    }

    this.updateThisLine = function () {
        if (!this.line || !this.line.visible) return;
        this.line.position.copy(new THREE.Vector3().copy(this.linePdata.vector).applyMatrix4(this.linePdata.matrix)).applyMatrix4(this.oscene.matrix)
        this.render();
    }

    this.drawPolyline = function (evt) {

        let vdata = this.getClosestPointOfCloud(evt)
        
        let vector = vdata.point;

        let matrix = this.groupList[vdata.id].group.matrix;

        if (this.polyline) this.oscene.remove(this.polyline);

        if (!this.polylineData) {
            this.polylineData = [];
            this.polylineMatrix = [];
        }

        this.polylineData.push(vector)
        this.polylineMatrix.push(matrix)

        let points = [];
        for (let i = 0; i < this.polylineData.length; i++) {
            points.push(new THREE.Vector3().copy(this.polylineData[i]).applyMatrix4(this.polylineMatrix[i]))
        }
        let rdata = this.vectorCenter(points)


        const geometry = new THREE.BufferGeometry().setFromPoints(rdata.points);
        const material = new THREE.LineBasicMaterial({
            color: pointcolor(),
            // size: 0.2
        });
        this.polyline = new THREE.Line(geometry, material);
        this.polyline.position.copy(rdata.position)
        this.polyline.frustumCulled = false;
        this.oscene.add(this.polyline);
        this.render();
        this.showDistance(this.polylineData, this.polylineMatrix);
    }

    this.updatePolyline = function () {
        if (this.polyline) this.oscene.remove(this.polyline);
        let points = [];
        for (let i = 0; i < this.polylineData.length; i++) {
            points.push(new THREE.Vector3().copy(this.polylineData[i]).applyMatrix4(this.polylineMatrix[i]))
        }
        let rdata = this.vectorCenter(points)


        const geometry = new THREE.BufferGeometry().setFromPoints(rdata.points);
        const material = new THREE.LineBasicMaterial({
            color: pointcolor(),
            // size: 0.2
        });
        this.polyline = new THREE.Line(geometry, material);
        this.polyline.position.copy(rdata.position)
        this.polyline.frustumCulled = false;
        this.oscene.add(this.polyline);
        this.render();
    }

    this.setCrossSection = function (evt) {
        this.mouse.target.x = (evt.offsetX / this.canvas.clientWidth) * 2 - 1;
        this.mouse.target.y = - (evt.offsetY / this.canvas.clientHeight) * 2 + 1;

        let raycaster = new THREE.Raycaster();

        raycaster.setFromCamera(this.mouse.target, this.camera);

        let point = new THREE.Vector3();

        let minDistance = Infinity;

        let sind;

        let closestPoint = new THREE.Vector3();

        if (this.activeId.length <= 0) return;
        let target = this.groupList[this.activeId[0]];

        if (!target.group.visible) return;

        let group = target.group;

        let array = group.children[0].geometry.attributes.position.array;

        for (let i = 0; i < array.length; i += 3) {

            raycaster.ray.closestPointToPoint(new THREE.Vector3(array[i], array[i + 1], array[i + 2]).applyMatrix4(target.group.matrix).applyMatrix4(this.oscene.matrix), point)

            let distanceSq = new THREE.Vector3(array[i], array[i + 1], array[i + 2]).applyMatrix4(target.group.matrix).applyMatrix4(this.oscene.matrix).distanceToSquared(point);

            if (distanceSq < minDistance) {

                closestPoint.set(array[i], array[i + 1], array[i + 2]);

                minDistance = distanceSq;

                sind = i;

            }

        }

        let x = array[sind];
        let y = array[sind + 1];
        let z = array[sind + 2];

        let vector = new THREE.Vector3(x, y, z)
        let matrix = target.group.matrix;
        let ovector = new THREE.Vector3().copy(vector).applyMatrix4(matrix)
        vector.applyMatrix4(matrix).applyMatrix4(this.oscene.matrix)

        if (!this.line) {

            let geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3()]);

            let material = new THREE.PointsMaterial({ size: selectedsize(), vertexColors: false, color: selectedcolor() });

            let points = new THREE.Points(geometry, material);
            points.frustumCulled = false;

            this.line = new THREE.Object3D().add(points);
            this.line.position.copy(ovector)

            this.oscene.add(this.line);

        } else {

            let array = this.line.position;
            this.getCrossSection({ x: array.x, y: array.y, z: array.z }, { x: vector.x, y: vector.y, z: vector.z });

            this.oscene.remove(this.line)
            this.line = undefined;

        }

        this.render()
    }

    this.getCrossSection = (a, b, trigger = true) => {
        // console.log(a, b)
        this.clipPoints = [new THREE.Vector3(a.x, a.y, a.z), new THREE.Vector3(b.x, b.y, b.z)];
        if (this.clipGrid) this.scene.remove(this.clipGrid);
        let aa = new THREE.Vector3().copy(a)
        let bb = new THREE.Vector3().copy(b)
        let v1 = new THREE.Vector3().copy(aa)
        let v2 = new THREE.Vector3().copy(bb)
        let pn = document.getElementById('cross-plane').value;
        let normal = new THREE.Vector3();
        if (pn == "x") {
            normal.z = 1;
            normal.y = -(v1.z - v2.z) / (v1.y - v2.y);
        } else if (pn == "y") {
            normal.z = 1;
            normal.x = -(v1.z - v2.z) / (v1.x - v2.x);
        } else if (pn == "z") {
            normal.y = 1;
            normal.x = -(v1.y - v2.y) / (v1.x - v2.x);
        }
        normal.normalize();
        let yb = new THREE.Vector3().copy(normal)
        
        let normal2 = new THREE.Vector3(-normal.x, -normal.y, -normal.z)
        let constant = -(normal.x * v1.x + normal.y * v1.y + normal.z * v1.z);
        let width = crossWidth()
        let offset = crossOffset()
        this.cplanes[0].set(normal, (constant + width / 2 + offset))
        this.cplanes[1].set(normal2, -(constant - width / 2 + offset))
        this.renderer.localClippingEnabled = true;
        let added = new THREE.Vector3(normal.x * offset, normal.y * offset, normal.z * offset)
        this.clipGrid = new THREE.Object3D();
        let grid = new THREE.GridHelper(20, 20);
        this.clipGrid.add(grid);
        let pposition = v1.add(v2).divideScalar(2);
        this.clipGrid.position.copy(new THREE.Vector3().copy(pposition).sub(added))
        // this.clipGrid.quaternion.copy(new THREE.Quaternion().setFromRotationMatrix(matrix))
        // grid.rotation[pn] = Math.PI / 2;
        grid.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), yb))
        this.scene.add(this.clipGrid)
        this.localClip = { normal: new THREE.Vector3().copy(normal), normal2: new THREE.Vector3().copy(normal2), constant, position: pposition };
        console.log('setted')
        if (trigger)
            $('#btn-rotate3').trigger('click')
    }

    this.updateCrossSection = () => {
        if (!this.localClip) return;
        console.log('updated')
        let { normal, normal2, constant, position } = this.localClip;
        let width = crossWidth()
        let offset = crossOffset()
        this.cplanes[0].set(normal, (constant + width / 2 + offset))
        this.cplanes[1].set(normal2, -(constant - width / 2 + offset))

        let added = new THREE.Vector3(normal.x * offset, normal.y * offset, normal.z * offset)
        this.clipGrid.position.copy(new THREE.Vector3().copy(position).sub(added))

        this.render();
    }

    // this.updateCrossSectionByGlobal = () => {
    //     if (!this.localClip) return;
    //     console.log('updatedG')
    //     let { normal, normal2, constant, position } = this.localClip;
    //     // ////////////////////////////////////////////////////////////////////////////////////
    //     let gp = new THREE.Vector3().copy(this.gcs.position)
    //     let gm = new THREE.Matrix4().copy(this.gcs.matrix)
    //     let gq = new THREE.Quaternion().setFromRotationMatrix(gm)
    //     gq.x = -gq.x; gq.y = -gq.y; gq.z = -gq.z;

    //     this.gcs.rotation.z += deltaX / 100;
    //     this.gcs.rotation.x += deltaY / 100;
    //     gm.makeRotationFromEuler(this.gcs.rotation)
    //     let guq = new THREE.Quaternion().setFromRotationMatrix(gm);
    //     // ////////////////////////////////////////////////////////////////////////////////////
    //     let grid = this.clipGrid;
    //     grid.position.sub(gp);
    //     grid.position.applyQuaternion(gq)
    //     grid.position.applyQuaternion(guq)
    //     grid.applyQuaternion(gq)
    //     grid.applyQuaternion(guq)
    //     grid.position.add(gp)

    //     let ctr = grid.position;

    //     normal.applyQuaternion(gq)
    //     normal.applyQuaternion(guq).normalize()
    //     normal2.applyQuaternion(gq)
    //     normal2.applyQuaternion(guq).normalize()

    //     constant = -(normal.x * ctr.x + normal.y * ctr.y + normal.z * ctr.z);
    //     position = new THREE.Vector3().copy(ctr)



    //     this.updateCrossSection()
    // }

    this.addPoint = function (evt) {

        if (!this.birdEyePlane) {

            let target = this.groupList[this.activeId[0]];
            if (!target.group.visible) return;
            let group = target.group;

            this.birdEyePlane = true;
            this.setCameraFromT(new THREE.Vector3(0, 0, 20).applyMatrix4(group.matrix).applyMatrix4(this.oscene.matrix), new THREE.Vector3(0, 0, 0).applyMatrix4(group.matrix).applyMatrix4(this.oscene.matrix))
            this.render()
            this.polygonRender();

        } else {

            this.mouse.target.x = (evt.offsetX / this.canvas.clientWidth) * 2 - 1;
            this.mouse.target.y = - (evt.offsetY / this.canvas.clientHeight) * 2 + 1;

            let raycaster = new THREE.Raycaster();

            raycaster.setFromCamera(this.mouse.target, this.camera);

            if (this.activeId.length < 1) return;

            let target = this.groupList[this.activeId[0]];
            if (!target.group.visible) return;

            let p1 = new THREE.Vector3(),
                p2 = new THREE.Vector3(),
                p3 = new THREE.Vector3();
            let geometry = target.group.children[0].geometry;
            let position = geometry.attributes.position;
            let index = geometry.index;
            let v = new THREE.Vector3();
            let rv;
            let dis = Infinity;
            let inp = new THREE.Vector3();
            let faces = index.count / 3;

            for (let i = 0; i < faces; i++) {

                p1.fromBufferAttribute(position, index.array[i * 3 + 0]).applyMatrix4(target.group.matrix).applyMatrix4(this.oscene.matrix);
                p2.fromBufferAttribute(position, index.array[i * 3 + 1]).applyMatrix4(target.group.matrix).applyMatrix4(this.oscene.matrix);
                p3.fromBufferAttribute(position, index.array[i * 3 + 2]).applyMatrix4(target.group.matrix).applyMatrix4(this.oscene.matrix);

                let d = raycaster.ray.distanceSqToPoint(p1);
                if (d < dis) {
                    dis = d;
                    inp.copy(p1)
                }
                d = raycaster.ray.distanceSqToPoint(p2);
                if (d < dis) {
                    dis = d;
                    inp.copy(p2)
                }
                d = raycaster.ray.distanceSqToPoint(p3);
                if (d < dis) {
                    dis = d;
                    inp.copy(p3)
                }

                rv = raycaster.ray.intersectTriangle(p1, p2, p3, false, v)
                if (rv) {
                    break;
                }
            }
            if (!rv) {
                
                let normal = new THREE.Vector3(0, 0, 1).applyQuaternion(new THREE.Quaternion().setFromRotationMatrix(target.group.matrix).setFromRotationMatrix(this.oscene.matrix)).normalize()
                let distance = -(normal.x * inp.x + normal.y * inp.y + normal.z * inp.z)
                let plane = new THREE.Plane(normal, distance)
                rv = raycaster.ray.intersectPlane(plane, v)
            }
            let om = target.group.matrix;
            let p = new THREE.Vector3().setFromMatrixPosition(om)
            let q = new THREE.Quaternion().setFromRotationMatrix(om)
            q.x = -q.x; q.y = -q.y; q.z = -q.z;
            let op = new THREE.Vector3().setFromMatrixPosition(this.oscene.matrix)
            let oq = new THREE.Quaternion().setFromRotationMatrix(this.oscene.matrix)
            oq.x = -oq.x; oq.y = -oq.y; oq.z = -oq.z;
            rv.sub(op).applyQuaternion(oq).sub(p).applyQuaternion(q);

            this.reloadModelFromArray(target.name, [...target.group.children[0].geometry.attributes.position.array, rv.x, rv.y, rv.z], this.activeId[0])

        }
    }


    this.showDistance = (lines, matrixs) => {
        $(".distance").remove();
        for (let i = 1; i < lines.length; i++) {
            let a = lines[i];
            let b = lines[i - 1];
            let aa = new THREE.Vector3().copy(a).applyMatrix4(matrixs[i]).applyMatrix4(this.oscene.matrix);
            let bb = new THREE.Vector3().copy(b).applyMatrix4(matrixs[i - 1]).applyMatrix4(this.oscene.matrix);
            let distance = aa.distanceTo(bb).toFixed(2);
            let cc = new THREE.Vector3().copy(aa).add(bb).divideScalar(2);
            cc.project(this.camera)
            let left = (cc.x + 1) * this.parent_canvas.clientWidth / 2;
            let top = (-cc.y + 1) * this.parent_canvas.clientHeight / 2;
            $(this.parent_canvas).append(`<span class="distance" style="position:absolute;display:inline-block;top:${top}px;left:${left}px;">${distance}m</span>`);
        }
    }

    this.initPolyline = function () {
        if (this.polyline) {
            this.oscene.remove(this.polyline)
            this.polyline = undefined;
        }
        this.polylineData = undefined;
        this.polylineMatrix = undefined;
        this.showDistance([], []);
        this.render();
    }

    this.finishdraw = (evt) => {

        this.drawState = false;

        let raycaster = new THREE.Raycaster();

        let camera = this.camera;

        let pointOnPlane = new THREE.Vector3();

        let plane = this.plane;

        let canvas = this.canvas;

        if (this.activeId.length < 1) return;



        if (this.polygon.length > 2) {

            let cx = this.cameraLookAt.x - this.camera.position.x;
            let cy = this.cameraLookAt.y - this.camera.position.y;
            let cz = this.cameraLookAt.z - this.camera.position.z;

            let a = 'x';
            let b = 'z';
            if (cx == 0 && cy == 0) b = 'y';
            if (cy == 0 && cz == 0) a = 'y';
            console.log(a, b)
            let normal = new THREE.Vector3(cx, cy, cz).normalize();
            this.plane.set(normal, -(normal.x * this.cameraLookAt.x + normal.y * this.cameraLookAt.y + normal.z * this.cameraLookAt.z))
            // console.log(this.plane)
            let vs = [];

            for (let i = 0; i < this.polygon.length; i++) {

                let mouse = new THREE.Vector2()

                mouse.x = (this.polygon[i][0] / canvas.clientWidth) * 2 - 1;
                mouse.y = - (this.polygon[i][1] / canvas.clientHeight) * 2 + 1;

                raycaster.setFromCamera(mouse, camera);
                // console.log(raycaster.ray)
                raycaster.ray.intersectPlane(plane, pointOnPlane);
                console.log(pointOnPlane)

                vs.push({ x: pointOnPlane[a], y: pointOnPlane[b] })

            }
            console.log(vs)

            for (let id of this.activeId) {

                let target = this.groupList[id];

                let group = target.group;

                if (evt.ctrlKey && target.selectedCount > 0) {

                    let geometry = target.selectedGroup.geometry;

                    let position = geometry.attributes.position;

                    let lop = target.selectedCount;

                    target.selectedCount = 0;

                    for (let i = 0; i < lop; i++) {

                        let direct = new THREE.Vector3(position.array[i * 3], position.array[i * 3 + 1], position.array[i * 3 + 2])

                        raycaster.set(camera.position, new THREE.Vector3().copy(direct).applyMatrix4(target.group.matrix).applyMatrix4(this.oscene.matrix).sub(camera.position).normalize());

                        raycaster.ray.intersectPlane(plane, pointOnPlane);

                        if (!isInside({ x: pointOnPlane[a], y: pointOnPlane[b] }, vs)) {

                            target.selectedPoints[target.selectedCount * 3 + 0] = direct.x;
                            target.selectedPoints[target.selectedCount * 3 + 1] = direct.y;
                            target.selectedPoints[target.selectedCount * 3 + 2] = direct.z;

                            target.selectedCount++;

                        } else {

                            target.unselectedPoints.push(direct.x, direct.y, direct.z)

                        }

                    }

                } else if (evt.shiftKey) {

                    let updatedUn = [];

                    for (let i = 0; i < target.unselectedPoints.length; i += 3) {

                        let direct = new THREE.Vector3(target.unselectedPoints[i], target.unselectedPoints[i + 1], target.unselectedPoints[i + 2])

                        raycaster.set(camera.position, new THREE.Vector3().copy(direct).applyMatrix4(target.group.matrix).applyMatrix4(this.oscene.matrix).sub(camera.position).normalize());

                        raycaster.ray.intersectPlane(plane, pointOnPlane);

                        if (isInside({ x: pointOnPlane[a], y: pointOnPlane[b] }, vs)) {

                            target.selectedPoints[target.selectedCount * 3 + 0] = direct.x;
                            target.selectedPoints[target.selectedCount * 3 + 1] = direct.y;
                            target.selectedPoints[target.selectedCount * 3 + 2] = direct.z;

                            target.selectedCount++;

                        } else {

                            updatedUn.push(direct.x, direct.y, direct.z)

                        }

                    }

                    target.unselectedPoints = updatedUn;

                } else {

                    target.selectedCount = 0;

                    let geometry = group.children[0].geometry;

                    let array = geometry.attributes.position.array;

                    target.unselectedPoints = [];

                    for (let i = 0; i < array.length; i += 3) {

                        raycaster.set(camera.position, new THREE.Vector3(array[i], array[i + 1], array[i + 2]).applyMatrix4(target.group.matrix).applyMatrix4(this.oscene.matrix).sub(camera.position).normalize());

                        raycaster.ray.intersectPlane(plane, pointOnPlane);

                        if (isInside({ x: pointOnPlane[a], y: pointOnPlane[b] }, vs)) {

                            target.selectedPoints[target.selectedCount * 3 + 0] = array[i];
                            target.selectedPoints[target.selectedCount * 3 + 1] = array[i + 1];
                            target.selectedPoints[target.selectedCount * 3 + 2] = array[i + 2];

                            target.selectedCount++;

                        } else {

                            target.unselectedPoints.push(array[i], array[i + 1], array[i + 2])

                        }

                    }

                }

                target.selectedGroup.geometry.setDrawRange(0, target.selectedCount);

                target.selectedGroup.geometry.attributes.position.needsUpdate = true;

            }

            this.render()

            this.polygonRender()

        }

    }

    this.cloudController = function () {

        this.canvas2.addEventListener('mousemove', (e) => {

            // if (!this.target.group.visible && !this.mouse.rightDown) return;

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

                case 'lineTrans':
                    if (this.mouse.rightDown) this.cameraMove(e)
                    else if (e.altKey && this.mouse.down) {
                        this.rotateGroup(e)
                        this.updateThisLine()
                    }
                    break;

                case 'addpoint':
                    if (this.mouse.rightDown) this.cameraMove(e)
                    break;

                case 'rotate3':
                    if (this.mouse.down && this.clipGrid) {
                        this.rotateGroup(e)
                        // this.updateCrossSection()
                    } else if (this.mouse.rightDown) this.cameraMove(e)
                    break;
                case 'polyline':
                    if (this.mouse.rightDown) {
                        this.cameraMove(e)
                        if (this.polyline) {
                            this.showDistance(this.polylineData, this.polylineMatrix)
                        }
                    }
                    else if (e.altKey && this.mouse.down) {
                        this.rotateGroup(e)
                        if (this.polyline) {
                            this.updatePolyline()
                            this.showDistance(this.polylineData, this.polylineMatrix)
                        }
                    }

                default:

            }
        }, false);

        this.canvas2.addEventListener('mousedown', (e) => {

            if (e.button == 0) {

                // if (!this.target.group.visible) return;

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

                    case 'reset':
                        this.setRotatePosition(e)
                        break;

                    case 'reset2':
                        this.setRotatePosition(e)
                        break;

                    case 'lineTrans':
                        if (e.altKey) return;
                        this.translateByLine(e)
                        break;

                    case 'polyline':
                        if (e.altKey) return;
                        this.drawPolyline(e)
                        break;
                    case 'addpoint':
                        this.addPoint(e)
                        break;
                    case 'cross':
                        this.setCrossSection(e)
                        break;

                    default:

                }

            } else if (e.button == 2) {

                this.mouseRightDown(e)
                // if (this.toolState == "polyline") {
                //     this.initPolyline();
                // }
                // else if (this.toolState == "addpoint") {
                //     this.initAddPoint();
                // }
            }

        }, false);

        this.canvas2.addEventListener('mouseup', (e) => {

            if (e.button == 0) {

                // if (!this.target.group.visible) return;

                this.mouseUp(e);

                switch (this.toolState) {

                    case 'pencil':
                        this.finishdraw(e)
                        break;

                }

            } else if (e.button == 2) {

                this.mouseRightUp(e)

            }

        }, false);

        this.canvas2.addEventListener('dblclick', (e) => {

            // if (!this.target.group.visible) return;

            switch (this.toolState) {

                case 'polygon':
                    this.finishdraw(e)
                    break;

            }

        }, false);

        this.canvas2.addEventListener('mousewheel', (e) => {

            if (this.toolState == 'rotate' || this.toolState == 'rotate2' || this.toolState == 'rotate3' || this.toolState == 'translate' || this.toolState == 'translate2' || this.toolState == 'lineTrans' || this.toolState == 'addpoint')
                this.mouseWheel(e);

        }, false);

        this.canvas2.addEventListener('contextmenu', (e) => {

            e.preventDefault();

        })

    }

    this.getObjDataOf2D = function () {

        if (this.activeId.length < 1) return;

        let target = this.groupList[this.activeId[0]];

        const exporter = new OBJExporter();

        let clone = target.group.children[1].clone();

        return exporter.parse(clone);

    }

    this.getObjDataOf3D = function () {

        if (this.activeId.length < 1) return;

        let target = this.groupList[this.activeId[0]];

        const exporter = new OBJExporter();

        let clone = target.group.children[3].clone();

        return exporter.parse(clone);

    }

    this.getObjData = function () {

        if (this.activeId.length < 1) return;

        let target = this.groupList[this.activeId[0]];

        const exporter = new OBJExporter();

        let obj = new THREE.Object3D();
        obj.applyMatrix4(target.group.matrix)
        obj.add(target.group.children[0].clone());
        if (target.group.children[1].visible) obj.add(target.group.children[1].clone());

        return exporter.parse(obj);

    }

    this.getTextData = function (param = false, matrix = false) {

        if (this.activeId.length < 1) return;

        let target = this.groupList[this.activeId[0]];

        let result = "";

        let array;

        if (!param) {

            array = target.group.children[0].geometry.attributes.position.array;
            let matrix = target.group.matrix;
            for (let i = 0; i < array.length; i += 3) {

                let point = new THREE.Vector3(array[i], array[i + 1], array[i + 2]).applyMatrix4(matrix)
                result += `        ${point.x},        ${point.y},        ${point.z}\n`;

            }

        } else {

            if (!matrix) {

                array = param;

                for (let i = 0; i < array.length; i += 3) {

                    result += `        ${array[i]},        ${array[i + 1]},        ${array[i + 2]}\n`;

                }

            } else {

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

        for (let id of this.activeId) {

            let target = this.groupList[id];

            target.group.children[1].visible = v;

        }

        this.render();

    }

    this.set3dMeshVisibility = function (v) {

        for (let id of this.activeId) {

            let target = this.groupList[id];

            target.group.children[3].visible = v;

        }

        this.render();

    }

    this.setMeshWireframe = function (v) {

        for (let id of this.activeId) {

            let target = this.groupList[id];

            target.group.children[1].material.wireframe = v;
            target.group.children[3].material.wireframe = v;

        }

        this.render();

    }

    this.setHeightMapColor = function (v) {

        for (let id of this.activeId) {

            let target = this.groupList[id];

            target.group.children[0].material.vertexColors = v;
            target.group.children[0].material.needsUpdate = true;

            target.group.children[1].material.vertexColors = v;
            target.group.children[1].material.needsUpdate = true;

        }

        this.setPointColor(v ? "#ffffff" : pointcolor())

        this.render();
    }

    this.setCoordinate = function (v) {

        for (let id of this.activeId) {

            let target = this.groupList[id];

            target.group.children[4].visible = v;

        }

        this.render();

    }

    this.setPointColor = function (c) {

        for (let id of this.activeId) {

            let target = this.groupList[id];

            target.group.children[0].material.color.set(c);
            target.group.children[1].material.color.set(c);

        }

        this.render();

    }

    this.setDelaunyColor = function (c) {

        for (let id of this.activeId) {

            let target = this.groupList[id];

            target.group.children[3].material.color.set(c);

        }

        this.render();

    }

    this.setSelectedSize = function (c) {

        for (let target of this.groupList) {

            target.group.children[2].material.size = c;
            target.group.children[2].material.needsUpdate = true;

        }

        this.render();

    }

    this.setPointSize = function (c) {

        for (let target of this.groupList) {

            target.group.children[0].material.size = c;
            target.group.children[0].material.needsUpdate = true;

        }

        this.render();

    }

    this.setSelectedColor = function (c) {

        for (let id of this.activeId) {

            let target = this.groupList[id];

            target.group.children[2].material.color.set(c);

        }

        this.render();

    }

    this.setToolState = function (tool) {

        this.initDraw();
        this.initSelectedPoints();
        this.render()

        this.toolState = tool;

    }

    this.setModelFromSelectedPoints = function () {

        for (let id of this.activeId) {

            let target = this.groupList[id];

            if (target.selectedCount < 4) {

                alert("Delaunay 3D triangulation requires 4 or more points.")

                return;

            }

            let array = [...target.group.children[0].geometry.attributes.position.array];

            this.addToHistory(target.history, array);

            let updatePoints = [];

            for (let i = 0; i < target.selectedCount; i++) {

                updatePoints.push(target.selectedPoints[i * 3], target.selectedPoints[i * 3 + 1], target.selectedPoints[i * 3 + 2])

            }

            this.reloadModelFromArray(target.name, updatePoints, id);

        }

        this.initDraw();
    }

    this.changeBtnSU = function () {

        for (let id of this.activeId) {

            let target = this.groupList[id];

            let unselec2 = [...target.unselectedPoints];

            target.unselectedPoints = [];

            for (let i = 0; i < target.selectedCount; i++) {

                target.unselectedPoints.push(target.selectedPoints[i * 3], target.selectedPoints[i * 3 + 1], target.selectedPoints[i * 3 + 2])

            }

            target.selectedCount = unselec2.length / 3;

            for (let i = 0; i < unselec2.length; i += 3) {

                target.selectedPoints[i] = unselec2[i];
                target.selectedPoints[i + 1] = unselec2[i + 1];
                target.selectedPoints[i + 2] = unselec2[i + 2];

            }

            target.selectedGroup.geometry.setDrawRange(0, target.selectedCount);

            target.selectedGroup.geometry.attributes.position.needsUpdate = true;

        }

        this.initDraw();
        this.render()

    }

    this.deleteSelectedPoints = function () {

        for (let id of this.activeId) {

            let target = this.groupList[id];

            if (target.unselectedPoints.length < 12) {

                alert("Delaunay 3D triangulation requires 4 or more points.")

                return;

            }

            let array = [...target.group.children[0].geometry.attributes.position.array];

            this.addToHistory(target.history, array)

            this.reloadModelFromArray(target.name, [...target.unselectedPoints], id);

        }

        this.initDraw();

    }

    this.windowResize = () => {

        this.camera.aspect = this.parent_canvas.clientWidth / this.parent_canvas.clientHeight;

        this.camera.updateProjectionMatrix();

        this.renderer.setSize((this.parent_canvas.clientWidth - 30), this.parent_canvas.clientHeight);

        this.render()
        this.initDraw();

    }

    this.gridMinimumFilter = function (cellSize, all = true) {

        for (let id of this.activeId) {

            let target = this.groupList[id];

            let array = target.group.children[0].geometry.attributes.position.array;

            let filteredPoints;

            if (all) {
                filteredPoints = filters.gridMinimumFilter(cellSize, array)
            }
            else {
                let array = [];
                let count = target.selectedCount * 3;
                for (let i = 0; i < count; i++) {
                    array.push(target.selectedPoints[i])
                }
                filteredPoints = filters.gridMinimumFilter(cellSize, array)
                filteredPoints = [...target.unselectedPoints, ...filteredPoints];
            }

            if (filteredPoints.length < 12) {

                alert("Delaunay 3D triangulation requires 4 or more points.")

                continue;

            }

            this.addToHistory(target.history, array)

            this.reloadModelFromArray(target.name, filteredPoints, id)

        }

        this.initDraw();

    }

    this.voxelGridFilter = function (cellSize, all = true) {

        for (let id of this.activeId) {

            let target = this.groupList[id];

            let array = target.group.children[0].geometry.attributes.position.array;

            let filteredPoints;
            if (all) {
                filteredPoints = filters.voxelGridFilter(cellSize, array)
            }
            else {
                let array = [];
                let count = target.selectedCount * 3;
                for (let i = 0; i < count; i++) {
                    array.push(target.selectedPoints[i])
                }
                filteredPoints = filters.voxelGridFilter(cellSize, array)
                filteredPoints = [...target.unselectedPoints, ...filteredPoints];
            }

            if (filteredPoints.length < 12) {

                alert("Delaunay 3D triangulation requires 4 or more points.")

                continue;

            }

            this.addToHistory(target.history, array)
            console.log("reloaded", id)
            this.reloadModelFromArray(target.name, filteredPoints, id)
        }

        this.initDraw();

    }

    this.outlierRemovalFilter = function (num, dev, all = true) {

        for (let id of this.activeId) {

            let target = this.groupList[id];

            let array = target.group.children[0].geometry.attributes.position.array;

            let filteredPoints

            if (all) {
                filteredPoints = filters.updatedRemovalFilter(num, dev, array)
            }
            else {
                let array = [];
                let count = target.selectedCount * 3;
                for (let i = 0; i < count; i++) {
                    array.push(target.selectedPoints[i])
                }
                filteredPoints = filters.updatedRemovalFilter(num, dev, array)
                filteredPoints = [...target.unselectedPoints, ...filteredPoints];
            }

            if (filteredPoints.length < 12) {

                alert("Delaunay 3D triangulation requires 4 or more points.")

                continue;

            }

            this.addToHistory(target.history, array)

            this.reloadModelFromArray(target.name, filteredPoints, id)

        }

        this.initDraw();

    }

    this.passThroughFilter = function (pass, limit1, limit2, all = true) {

        for (let id of this.activeId) {

            let target = this.groupList[id];

            let array = target.group.children[0].geometry.attributes.position.array;

            let filteredPoints

            if (all) {
                filteredPoints = filters.passThroughFilter(pass, limit1, limit2, array)
            }
            else {
                let array = [];
                let count = target.selectedCount * 3;
                for (let i = 0; i < count; i++) {
                    array.push(target.selectedPoints[i])
                }
                filteredPoints = filters.passThroughFilter(pass, limit1, limit2, array)
                filteredPoints = [...target.unselectedPoints, ...filteredPoints];
            }

            if (filteredPoints.length < 12) {

                alert("Delaunay 3D triangulation requires 4 or more points.")

                return;

            }

            this.addToHistory(target.history, array)

            this.reloadModelFromArray(target.name, filteredPoints, id)

        }

        this.initDraw();

    }

    this.popupHistory = function (e) {

        for (let id of this.activeId) {

            let target = this.groupList[id];

            if (target.history.step > 0) {

                e.preventDefault();

                this.reloadModelFromArray(target.name, target.history.data[target.history.step - 1], id)

                this.render()

                this.initDraw();

                target.history.step--;

            }

        }

    }

    this.getSavePoints = function () {

        let target = this.groupList[this.activeId[0]];

        let array = [...target.group.children[0].geometry.attributes.position.array];

        return array;

    }

    this.getSaveMatrixArray = function () {

        let target = this.groupList[this.activeId[0]];

        let result = target.group.matrix.elements;

        return [...result];

    }

    this.calculateVolume = function (h = undefined, v) {

        let sessionHistory = this.sessionHistory;
        let heap = [];
        let hmatrix;
        if (h) {
            heap = sessionHistory[h].data;
            hmatrix = new THREE.Matrix4().fromArray(sessionHistory[h].matrix);
        }
        else {
            let target = this.groupList[this.activeId[0]]
            if (!target) return;
            let count = 3 * target.selectedCount;
            for (let i = 0; i < count; i++) {
                heap.push(target.selectedPoints[i])
            }
            hmatrix = new THREE.Matrix4().fromArray(target.matrix);
        }
        let ground = sessionHistory[v].data;


        let gmatrix = new THREE.Matrix4().fromArray(sessionHistory[v].matrix);

        let hclone = [];
        let gclone = [];

        for (var i = 0; i < heap.length; i += 3) {

            let v = new THREE.Vector3(heap[i], heap[i + 1], heap[i + 2]).applyMatrix4(hmatrix)

            hclone.push(v.x, v.y, v.z)

        }
        for (var i = 0; i < ground.length; i += 3) {

            let v = new THREE.Vector3(ground[i], ground[i + 1], ground[i + 2]).applyMatrix4(gmatrix)

            gclone.push(v.x, v.y, v.z)

        }

        let volume = Math.abs(this.getSelVolume(hclone, gclone));

        if (h) sessionHistory[h].volume = volume;

        return volume;

    }

    this.setVolumeMassDensty = function (id, v, m, d) {

        this.sessionHistory[id].volume = v;
        this.sessionHistory[id].mass = m;
        this.sessionHistory[id].densty = d;

    }

    this.getSelVolume = function (heap, ground) {

        let indexedHeap = this.getIndexedGeom(heap);
        let indexedGround = this.getIndexedGeom(ground);

        let added = { x: indexedHeap.x, y: indexedHeap.y, z: indexedHeap.z };
        console.log(added)
        let triangleData = this.specialTriangleData(indexedGround);

        // console.log(indexedHeap, indexedGround)

        let sum2 = 0;

        let p1 = new THREE.Vector3(),
            p2 = new THREE.Vector3(),
            p3 = new THREE.Vector3();

        let position = indexedHeap.geometry.attributes.position;

        let index = indexedHeap.geometry.index;

        let faces = index.count / 3;

        let v = new THREE.Vector3();

        let tid, t;

        for (let i = 0; i < faces; i++) {

            let result = 0;

            p1.fromBufferAttribute(position, index.array[i * 3 + 0]).add(added);
            p2.fromBufferAttribute(position, index.array[i * 3 + 1]).add(added);
            p3.fromBufferAttribute(position, index.array[i * 3 + 2]).add(added);

            tid = Math.floor(p1.x) + '.' + Math.floor(p1.y);
            let t1, t2, t3;
            if (triangleData[tid]) t1 = triangleData[tid]; else t1 = false;
            if (!t1) continue;
            tid = Math.floor(p2.x) + '.' + Math.floor(p2.y);
            if (triangleData[tid]) t2 = triangleData[tid]; else t2 = false;
            if (!t2) continue;
            tid = Math.floor(p3.x) + '.' + Math.floor(p3.y);
            if (triangleData[tid]) t3 = triangleData[tid]; else t3 = false;
            if (!t3) continue;

            let z1, z2, z3;

            let ray2 = new THREE.Ray(p2)
            let q2;
            for (let trg of t2) {
                q2 = ray2.intersectTriangle(trg.a, trg.b, trg.c, false, v)
                if (q2) {
                    z2 = q2.z;
                    break;
                }
            }
            if (!q2) continue;

            let ray3 = new THREE.Ray(p3)
            let q3;
            for (let trg of t3) {
                q3 = ray3.intersectTriangle(trg.a, trg.b, trg.c, false, v)
                if (q3) {
                    z3 = q3.z;
                    break;
                }
            }
            if (!q3) continue;

            let ray1 = new THREE.Ray(p1)
            let q1;
            for (let trg of t1) {
                q1 = ray1.intersectTriangle(trg.a, trg.b, trg.c, false, v)
                if (q1) {
                    z1 = q1.z;
                    break;
                }
            }
            if (!q1) continue;

            // console.log(p1.x, p1.y, p1.z, q1.x, q1.y, q1.z)
            p1.z -= z1;
            p2.z -= z2;
            p3.z -= z3;
            console.log(q1.z - z1, q2.z = z2, q3.z - z3)
            if (p1.z > 0 && p2.z <= 0 && p3.z <= 0) result = this.e1Volume(p1, p2, p3);
            else if (p2.z > 0 && p1.z <= 0 && p3.z <= 0) result = this.e1Volume(p2, p1, p3);
            else if (p3.z > 0 && p1.z <= 0 && p2.z <= 0) result = this.e1Volume(p3, p1, p2);
            else if (p3.z >= 0 && p2.z >= 0 && p1.z < 0) result = this.e2Volume(p3, p2, p1);
            else if (p1.z >= 0 && p3.z >= 0 && p2.z < 0) result = this.e2Volume(p1, p3, p2);
            else if (p1.z >= 0 && p2.z >= 0 && p3.z < 0) result = this.e2Volume(p1, p2, p3);
            else if (p1.z >= 0 && p2.z >= 0 && p3.z >= 0) result = this.signedVolumeOfTriangle(p1, p2, p3);
            // console.log(result)
            sum2 += result;

        }
        if (sum2 < 1e-3)
            sum2 = 0;
        return sum2;

    }

    this.specialTriangleData = ({ geometry, x, y, z }) => {

        let added = { x, y, z };
        console.log(added)
        let rData = {};

        let position = geometry.attributes.position;

        let index = geometry.index;

        let faces = index.count / 3;

        let p1 = new THREE.Vector3(),
            p2 = new THREE.Vector3(),
            p3 = new THREE.Vector3();

        for (let i = 0; i < faces; i++) {

            p1.fromBufferAttribute(position, index.array[i * 3 + 0]).add(added);
            p2.fromBufferAttribute(position, index.array[i * 3 + 1]).add(added);
            p3.fromBufferAttribute(position, index.array[i * 3 + 2]).add(added);

            let xloop = this.getminmax(p1.x, p2.x, p3.x);
            let yloop = this.getminmax(p1.y, p2.y, p3.y);

            for (let i = xloop.min; i <= xloop.max; i++) {
                for (let j = yloop.min; j <= yloop.max; j++) {
                    let id = i + '.' + j;
                    if (!rData[id]) rData[id] = [{ a: new THREE.Vector3().copy(p1), b: new THREE.Vector3().copy(p2), c: new THREE.Vector3().copy(p3) }];
                    else rData[id].push({ a: new THREE.Vector3().copy(p1), b: new THREE.Vector3().copy(p2), c: new THREE.Vector3().copy(p3) });
                }
            }

        }

        return rData;

    }

    this.getminmax = function (a, b, c) {

        a = Math.floor(a)
        b = Math.floor(b)
        c = Math.floor(c)

        let min = a, max = a;

        if (min > b) min = b;
        if (min > c) min = c;
        if (max < b) max = b;
        if (max < c) max = c;

        return { min, max }

    }

    this.getIndexedGeom = function (array) {

        let points3d = [];

        let { x, y, z } = this.customCenter(array)

        for (let i = 0; i < array.length; i += 3) {

            points3d.push(new THREE.Vector3(parseFloat(array[i]), parseFloat(array[i + 1]), parseFloat(array[i + 2])));

        }

        let geometry = new THREE.BufferGeometry().setFromPoints(points3d);

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

        return { geometry, x, y, z };

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

        return this.signedVolumeOfTriangle(q, e, r) + this.signedVolumeOfTriangle(w, e, r)

    }

    this.customCenter = function (arrayData) {

        let x = 0, y = 0, z = 0, count = arrayData.length / 3;

        for (let i = 0; i < arrayData.length; i += 3) {

            x += arrayData[i];
            y += arrayData[i + 1];
            z += arrayData[i + 2];

        }

        x /= count;
        y /= count;
        z /= count;

        for (let i = 0; i < arrayData.length; i += 3) {

            arrayData[i] -= x;
            arrayData[i + 1] -= y;
            arrayData[i + 2] -= z;

        }

        return { x, y, z }

    }

    this.vectorCenter = function (vectorArray) {

        let x = 0, y = 0, z = 0, count = vectorArray.length;
        let newArray = [];
        for (let i = 0; i < count; i++) {

            x += vectorArray[i].x;
            y += vectorArray[i].y;
            z += vectorArray[i].z;
            newArray.push(new THREE.Vector3().copy(vectorArray[i]))
        }

        x /= count;
        y /= count;
        z /= count;

        for (let i = 0; i < count; i++) {

            newArray[i].x -= x;
            newArray[i].y -= y;
            newArray[i].z -= z;

        }

        return { position: new THREE.Vector3(x, y, z), points: newArray }
    }

    this.setListViewFunc = function (special) {

        this.listViewEngine = special;

    }

    this.CustomPointCloud = (name) => {

        let obj = new THREE.Object3D();

        this.activeId = [this.groupList.length];

        this.groupList.push({
            name: name,
            group: obj,
            history: {
                step: 0,
                data: []
            },
            unselectedPoints: [],
            selectedPoints: [],
            selectedCount: 0,
            changePosition: {
                x: 0, y: 0, z: 0
            },

            position: new THREE.Vector3(),
            quaternion: new THREE.Quaternion(),
            matrix: new THREE.Matrix4().elements,
            rotatePosition: {
                x: 0, y: 0, z: 0
            },
            version: 0,
            id:++gid,
        })

        return this.groupList[this.activeId[0]];

    }

    this.setTarget = function (id) {

        this.initSelectedPoints();

        this.activeId = [id];

        // this.target = this.groupList[id];

        this.listViewEngine(this.groupList, this.activeId);

        this.initDraw();

        this.updateModelname();

    }

    this.addTarget = function (id) {

        this.initSelectedPoints();

        for (let e of this.activeId) {
            if (e == id) return;
        }

        this.activeId.push(id)

        this.listViewEngine(this.groupList, this.activeId);

        this.initDraw();

        this.updateModelname();

    }

    this.updateModelname = () => {

        let namelist = this.activeId.map((id) => {
            return this.groupList[id].name;
        })

        // $("#modelpath").text(namelist)

    }

    this.setVisible = function (id, bl) {

        this.groupList[id].group.visible = bl;

        this.initDraw();

    }

    this.deletePC = function (id) {

        this.scene.remove(this.groupList[id].group);

        this.groupList = this.groupList.filter((target, index) => {
            return id != index;
        })

        this.activeId = this.activeId.filter((target, index) => {
            return target != id;
        })

        this.activeId = this.activeId.map((target, index) => {
            if (target > id) return target - 1;
            else return target;
        })

        // this.target = this.groupList[this.activeId[0]];

        this.listViewEngine(this.groupList, this.activeId)

        this.initDraw();

    }

    this.getTargetInfo = function () {

        if (this.activeId.length < 1) return;

        let group = this.groupList[this.activeId[0]].group;

        return {
            pointcolor: group.children[0].material.color.getHexString(),
            meshcolor: group.children[3].material.color.getHexString(),
            visible2: group.children[1].visible,
            visible3: group.children[3].visible,
            wireframe: group.children[1].material.wireframe,
            heightmap: group.children[0].material.vertexColors,
            coordinate: group.children[4].visible,
        }

    }

    this.initDraw = function () {

        this.polygon = [];


        if (this.line) this.line.visible = false;
        if (this.birdEyePlane) {
            // this.scene.remove(this.birdEyePlane.plane)
            // this.scene.remove(this.birdEyePlane.grid)
            this.birdEyePlane = undefined;
            this.setCameraPosition(new THREE.Vector3().copy(this.groupList[this.activeId[0]].group.position).add(this.oscene.position))
        }
        if (this.toolState == "rotate3") {
            this.renderer.localClippingEnabled = false;
            this.scene.remove(this.clipGrid)
            this.clipGrid = undefined;
        }

        this.polygonRender();
        if (this.polyline) {
            this.initPolyline()
        }

    }

    this.initSelectedPoints = function () {

        for (let id of this.activeId) {

            let target = this.groupList[id];

            target.selectedCount = 0;

            target.unselectedPoints = [...target.group.children[0].geometry.attributes.position.array];

            target.selectedGroup.geometry.setDrawRange(0, target.selectedCount);

        }

    }

    this.setGlobalCoordinate = function () {

        if (this.gcs && this.gcs.visible) return;
        if (this.activeId.length < 1) return;


        if (!this.gcs) {
            this.gcs = new THREE.Object3D();
            // let axe = new THREE.AxesHelper(15).setColors('crimson', 'chartreuse', 'cyan');
            let arrowX = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 10)
            arrowX.setColor('crimson')
            let arrowY = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 10)
            arrowY.setColor('chartreuse')
            let arrowZ = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 10)
            arrowZ.setColor('cyan')
            // axe.material.linewidth = 2;
            // axe.material.needsUpdate = true;
            // console.log(axe)
            this.gcs.add(arrowX)
            this.gcs.add(arrowY)
            this.gcs.add(arrowZ)
            this.gcs.position.copy(this.groupList[this.activeId[0]].group.position);

            // console.log('seted')
            this.scene.add(this.gcs)
        } else {
            this.gcs.visible = true;
            // console.log('visibled')
        }


        for (let i of this.activeId) {
            this.groupList[i].group.children[4].visible = false;
        }

        this.render()
    }

    this.deleteGlobalCoordinate = function () {
        // this.gcs.visible = false;
        if (!this.gcs || this.gcs.visible == false) return;
        // this.scene.remove(this.gcs)
        this.gcs.visible = false;
        // console.log('deleted')
        for (let i of this.activeId) {
            this.groupList[i].group.children[4].visible = true;
        }

        this.render()
    }

    // this.addToMultiGroup = function (id) {

    // }

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

function pointsize() {

    return document.getElementById('pointsize').value;

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

function coordinate() {

    return document.getElementById('coordinate').checked;

}

function surface() {

    return !document.getElementById('surface').checked;

}

function isInside(point, vs) {

    let x = point.x,
        y = point.y;

    let inside = false;

    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {

        let xi = vs[i].x,
            yi = vs[i].y;

        let xj = vs[j].x,
            yj = vs[j].y;

        let intersect = ((yi > y) != (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

        if (intersect) inside = !inside;

    }

    return inside;

}

// function getCurrentFilename() {

//     return document.getElementById('modelpath').innerText;

// }

function backToRotateMode(tool) {

    if (tool == "reset") {

        $("#btn-rotate2").trigger('click')

    } else if (tool == "reset2") {

        $("#btn-rotate").trigger('click')

    } else if (tool == "cross") {

        $("#btn-rotate3").trigger('click')

    }

}

function crossWidth() {
    return parseFloat(document.getElementById('cross-width').value);
}

function crossOffset() {
    return parseFloat(document.getElementById('cross-offset').value);
}