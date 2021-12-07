import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import Delaunator from './delaunator.js';
import { getminmaxhegihtfromarray, getminmaxheightfromjson, getrgb } from './XYZLoader.js';

export const timelapsLib = function (cv1, parent, delauny, surface, color, heightmap) {
    console.log(cv1, parent, delauny, surface, color, heightmap)
    const canvas = document.getElementById(cv1);
    const parent_canvas = document.getElementById(parent);
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(parent_canvas.clientWidth, parent_canvas.clientHeight);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, parent_canvas.clientWidth / parent_canvas.clientHeight, 0.01, 1000);
    const cameraLookAt = new THREE.Vector3();
    const mouse = {
        x: 0, y: 0, down: false, rightdown: false
    }
    // const controls = new OrbitControls(camera, renderer.domElement);

    this.init = function () {

        camera.position.set(0, -20, 6);
        camera.lookAt(0, 0, 0);

        var light = new THREE.DirectionalLight(0xffffff, 1.5);
        light.position.set(0, 0, 56);

        scene.add(light);
        scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        // scene.add(camera);

        scene.background = new THREE.Color(0x111111);

        window.addEventListener('resize', windowResize);


        canvas.addEventListener('mousemove', (evt) => {
            if (mouse.down) {
                sceneMove(evt)
            } else if (mouse.rightdown) {
                cameraMove(evt)
            }
        })

        canvas.addEventListener('mousedown', (evt) => {

            mouse.x = evt.clientX;
            mouse.y = evt.clientY;

            if (evt.button == 0) {
                mouse.down = true;
            } else if (evt.button == 2) {
                mouse.rightdown = true;
            }
        })

        canvas.addEventListener('mouseup', (evt) => {
            if (evt.button == 0) {
                mouse.down = false;
            } else if (evt.button == 2) {
                mouse.rightdown = false;
            }
        })

        canvas.addEventListener('contextmenu', (e) => {

            e.preventDefault();

        })

        canvas.addEventListener('mousewheel', (e) => {

            mouseWheel(e);

        }, false);

    }

    this.setModel = function (modelData) {
        // windowResize()
        if (this.activeModel) scene.remove(this.activeModel)
        // scene.clear()
        console.log(scene)
        this.models = [];
        let xx = 0, yy = 0, zz = 0;
        modelData.map((arrayData, i) => {
            if (arrayData.length === 0) return;
            let colors = [];
            let points3d = [];
            if (i == 0) {
                let { x, y, z } = this.firstCenter(arrayData)
                xx = x;
                yy = y;
                zz = z;
            } else
                this.restCenter(arrayData, xx, yy, zz);

            let values = getminmaxheightfromjson(arrayData);
            let min = values[0];
            let max = values[1];
            let model = new THREE.Object3D();

            for (let i = 0; i < arrayData.length; i++) {

                points3d.push(new THREE.Vector3(parseFloat(arrayData[i].x), parseFloat(arrayData[i].y), parseFloat(arrayData[i].z)));

                let zvalue = parseFloat(arrayData[i].z);

                let k = (zvalue - min) / (max - min);

                let rgb = getrgb(k);
                //set color from xyz
                colors.push(rgb[0]);
                colors.push(rgb[1]);
                colors.push(rgb[2]);

            }

            let geometry = new THREE.BufferGeometry().setFromPoints(points3d);
            // geometry.center()

            if (colors.length > 0) {

                geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

            }

            let material;

            if (heightmap) {

                document.getElementById('pointcolor').disabled = true;
                material = new THREE.PointsMaterial({ size: 0.2, vertexColors: true, color: "#ffffff" });

            } else
                material = new THREE.PointsMaterial({ size: 0.2, vertexColors: false, color: color });

            let points2 = new THREE.Points(geometry, material);

            model.add(points2);

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
                new THREE.MeshLambertMaterial({ color: heightmap ? "#ffffff" : color, wireframe: !surface, side: THREE.DoubleSide, vertexColors: heightmap })
            );

            mesh.visible = delauny;

            model.add(mesh);
            this.models.push(model)

        })
        console.log(this.models[0])
        scene.add(this.models[0])
        this.activeModel = this.models[0];
        windowResize()
        render();
        console.log('model added')

    }

    const render = function () {
        // console.log('render',scene,camera)
        renderer.render(scene, camera);

    }

    const windowResize = function () {
        // console.log(renderer)
        camera.aspect = parent_canvas.clientWidth / parent_canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(parent_canvas.clientWidth, parent_canvas.clientHeight);
        render()

    }

    this.onWindowResize = () => windowResize();

    const cameraMove = function (evt) {
        let deltaX = evt.clientX - mouse.x,
            deltaY = evt.clientY - mouse.y;

        mouse.x = evt.clientX;
        mouse.y = evt.clientY;

        let normal = new THREE.Vector3(cameraLookAt.x - camera.position.x, cameraLookAt.y - camera.position.y, cameraLookAt.z - camera.position.z).normalize()
        let op = new THREE.Vector3().copy(camera.position)
        let p = camera.position;

        let quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), normal);
        p.add(new THREE.Vector3(-deltaX / 15, 0, -deltaY / 15).applyQuaternion(quaternion))

        cameraLookAt.x += p.x - op.x;
        cameraLookAt.y += p.y - op.y;
        cameraLookAt.z += p.z - op.z;

        camera.lookAt(cameraLookAt);

        render()
    }

    const sceneMove = function (evt) {
        console.log('sceneMove')
        let deltaX = evt.clientX - mouse.x,
            deltaY = evt.clientY - mouse.y;

        mouse.x = evt.clientX;
        mouse.y = evt.clientY;

        scene.rotation.z += deltaX / 35;
        scene.rotation.x += deltaY / 35;

        render()
    }

    const mouseWheel = function (evt) {
        evt.preventDefault();

        let normal = new THREE.Vector3(cameraLookAt.x - camera.position.x, cameraLookAt.y - camera.position.y, cameraLookAt.z - camera.position.z).normalize()
        camera.position.x -= evt.deltaY / 100 * normal.x;
        camera.position.y -= evt.deltaY / 100 * normal.y;
        camera.position.z -= evt.deltaY / 100 * normal.z;

        cameraLookAt.x -= evt.deltaY / 100 * normal.x;
        cameraLookAt.y -= evt.deltaY / 100 * normal.y;
        cameraLookAt.z -= evt.deltaY / 100 * normal.z;

        camera.lookAt(cameraLookAt);

        render()
    }

    this.getImages = function () {
        if(!this.models || this.models.length === 0 ){
            alert('please load models first.')
            return;
        }
        let rdata = [];
        let lastmodel = this.activeModel;
        parent_canvas.style.height = '1080px';
        parent_canvas.style.width = '1920px';
        windowResize()
        for (let model of this.models) {
            scene.remove(lastmodel)
            scene.add(model)
            lastmodel = model
            render()
            rdata.push(canvas.toDataURL('image/jpeg', 1))
        }
        this.activeModel = lastmodel;
        // console.log(rdata)
        if (rdata[0] == rdata[1]) console.log('bigerrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrror')
        // var video = new Whammy.generateWebM(rdata, 1000);
        // console.log(video)
        parent_canvas.style.height = '135px';
        parent_canvas.style.width = '240px';
        windowResize()
        return rdata;
    }

    this.delauny = function (v) {
        for (let model of this.models) {
            model.children[1].visible = v;
        }
        console.log(v)
        render()
    }
    this.surface = function (v) {
        for (let model of this.models) {
            model.children[1].material.wireframe = !v;
        }
        console.log(v)
        render()
    }
    this.color = function (v) {
        if (document.getElementById('heightmapT').checked) return;
        for (let model of this.models) {
            model.children[0].material.color.set(v);
            model.children[1].material.color.set(v);
        }
        console.log(v)
        console.log(this.models[0].children[1].material)
        render()
    }
    this.heightmap = function (v) {
        if (v) {
            for (let model of this.models) {
                model.children[0].material.color.set('#ffffff');
                model.children[1].material.color.set('#ffffff');
                model.children[0].material.vertexColors = v;
                model.children[0].material.needsUpdate = true;
                model.children[1].material.vertexColors = v;
                model.children[1].material.needsUpdate = true;
            }
        } else {
            let color = document.getElementById('colorT').value;
            for (let model of this.models) {
                model.children[0].material.color.set(color);
                model.children[1].material.color.set(color);
                model.children[0].material.vertexColors = v;
                model.children[0].material.needsUpdate = true;
                model.children[1].material.vertexColors = v;
                model.children[1].material.needsUpdate = true;

            }
        }
        console.log(v)

        render()
    }

    this.setParams = function (bdelauny, bsurface, bcolor, bheightmap) {
        delauny = bdelauny;
        surface = bsurface;
        color = bcolor;
        heightmap = bheightmap;
    }

    this.firstCenter = function (jsonData) {

        let x = 0, y = 0, z = 0, count = jsonData.length;

        for (let i = 0; i < count; i++) {

            x += jsonData[i].x;
            y += jsonData[i].y;
            z += jsonData[i].z;

        }

        x /= count;
        y /= count;
        z /= count;

        for (let i = 0; i < count; i++) {

            jsonData[i].x -= x;
            jsonData[i].y -= y;
            jsonData[i].z -= z;

        }

        return { x, y, z }

    }

    this.restCenter = function (jsonData, x, y, z) {

        for (let i = 0; i < jsonData.length; i++) {

            jsonData[i].x -= x;
            jsonData[i].y -= y;
            jsonData[i].z -= z;

        }

        return { x, y, z }

    }

    this.init()

}
