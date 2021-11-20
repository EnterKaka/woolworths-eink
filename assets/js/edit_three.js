import * as THREE from './three.module.js';
import { owlStudio } from './owlStudio.js';

const cloudmachine = new owlStudio('viewer_3d', 'tool_2d', 'main_canvas');

cloudmachine.setListViewFunc((list, activeId) => {

    const dom = document.getElementById('modellist');

    dom.innerHTML = '';

    for (let i = 0; i < list.length; i++) {

        dom.innerHTML += `<div data-id="${i}" class="model ${actived(activeId, i) ? 'active' : ''} btn btn-outline-primary">
            <span data-id="${i}" class="modelname" title="${list[i].name}">${list[i].name}</span>
            <i data-id="${i}" class="${list[i].group.visible ? 'ft-eye' : 'ft-eye-off'} modeleye"></i>
            <a data-id="${i}" id="m-eye" class="modeldel" href="javascript:void(0)"><i class="ft-x"></i></a>
        </div>`;

        if (cloudmachine.gcs) continue;
        if (!actived(activeId, i)) {
            list[i].group.children[4].visible = false;
        } else if (document.getElementById('coordinate').checked) {
            list[i].group.children[4].visible = true;
        }

    }

    $(".modelname").on('click', function (e) {

        if (!e.ctrlKey) {
            console.log('click')

            cloudmachine.setTarget(parseInt(this.dataset.id))
            setCurrentViewSetting()

        } else {

            cloudmachine.addTarget(parseInt(this.dataset.id))
            setCurrentViewSetting()

        }

        cloudmachine.render();
    })

    $(".modelname").on('dblclick', function (e) {
        console.log('dblclicked')
        let target = cloudmachine.groupList[parseInt(this.dataset.id)];
        if (!e.ctrlKey) {
            cloudmachine.setCameraPosition(target.group.position)
        } else {
            cloudmachine.setCameraPosition(target.group.position)
        }

        cloudmachine.render();
    })

    $(".modeleye").on('click', function () {
        let visible = this.classList.contains('ft-eye');
        cloudmachine.setVisible(parseInt(this.dataset.id), !visible)
        if (visible) {
            this.classList.replace('ft-eye', 'ft-eye-off')
            // if (parseInt(this.dataset.id) == cloudmachine.activeId)
            // cloudmachine.target = undefined;
        }
        else {
            this.classList.replace('ft-eye-off', 'ft-eye')
            // if (parseInt(this.dataset.id) == cloudmachine.activeId)
            // cloudmachine.target = cloudmachine.groupList[cloudmachine.activeId];
        }
        cloudmachine.render();
    })

    $(".modeldel").on('click', function () {
        var r = confirm("do you really want to delete this point cloud?");
        if (r == true) {
            cloudmachine.deletePC(parseInt(this.dataset.id))
        }
        cloudmachine.render();
    })

})


function actived(activeId, i) {
    for (let target of activeId) {
        if (target == i) return true;
    }
    return false;
}

function expand() {
    $('#sidebar').toggleClass('hide');
    $('.navbar-container.content').toggleClass('expand');
    $('.app-content.content').toggleClass('expand');
    $('footer.footer').toggleClass('expand');
    setTimeout(() => {
        cloudmachine.windowResize()
        // $('#viewer_3d').width('calc(100%)');
    }, 500);

}

function setCurrentViewSetting() {

    let info = cloudmachine.getTargetInfo()

    console.log(info)

    const pcolor = $('#pointcolor')
    const dcolor = $('#delaunycolor')
    const delauny = $('#delauny')
    const delauny3 = $('#delauny3')
    const surface = $('#surface')
    const heightmap = $('#heightmapColor')
    // const coordinate = $('#coordinate')

    if (info.heightmap) {
        if (!heightmap[0].checked) {
            heightmap.trigger('click')
        }
        pcolor[0].disabled = true;
    } else {
        if (heightmap[0].checked) {
            heightmap.trigger('click')
        }
        pcolor[0].disabled = false;
        pcolor[0].value = "#" + info.pointcolor;
    }

    dcolor[0].value = "#" + info.meshcolor;

    if ((delauny[0].checked && !info.visible2) || (!delauny[0].checked && info.visible2)) {
        delauny.trigger('click')
    }

    if ((delauny3[0].checked && !info.visible3) || (!delauny3[0].checked && info.visible3)) {
        delauny3.trigger('click')
    }

    if ((surface[0].checked && info.wireframe) || (!surface[0].checked && !info.wireframe)) {
        surface.trigger('click')
    }

    // if ((coordinate[0].checked && !info.coordinate) || (!coordinate[0].checked && info.coordinate)) {
    //     coordinate.trigger('click')
    // }

}

function startApp() {
    let tempvaluetag = document.getElementById('pointcloud');
    if (tempvaluetag) {
        let pointcloud = tempvaluetag.value;
        pointcloud = JSON.parse(pointcloud);
        cloudmachine.reloadModelFromJSONData('new_Model', pointcloud);
    } else {
        const loader = new THREE.FileLoader();
        loader.load('./3dmodels/Weissspat_1632872292.txt', (text) => {
            cloudmachine.reloadModelFromData('Weissspat_1632872292.txt', text);
        });
    }
}

function btn_open_model() {
    $("#input_model").trigger("click");
}

function openModel_Fromlocal(e) {

    let files = e.target.files;
    if (files.length < 1) {
        return;
    }
    let file = files[0];
    let reader = new FileReader();
    let model_text;

    reader.addEventListener("load", () => {
        // this will then display a text file
        model_text = reader.result;
        if (file.name.split('.').pop() == 'obj') {
            cloudmachine.reloadModelFromObjData(file.name, model_text)
        }
        else {
            cloudmachine.reloadModelFromData(file.name, model_text);
        }
    }, false);

    if (file) {
        reader.readAsText(file);
    }
}

function download(filename, type, text) {
    let element = document.createElement('a');

    element.setAttribute('href', `data:${type}/plain;charset=utf-8,` + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';

    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function startProgress() {
    console.log('started')
    document.getElementById('fprgs').style.display = "block";
}

function endProgress() {
    document.getElementById('fprgs').style.display = "none";
}

function reloadHGlist(heapSelec = false) {
    const heap = document.getElementById('vheap-list');
    const ground = document.getElementById('vground-list');
    let hv = heap.value;
    heap.innerHTML = "";
    ground.innerHTML = "";
    let sessionHistory = cloudmachine.sessionHistory;
    for (let i = sessionHistory.length - 1; i >= 0; i--) {
        heap.innerHTML += `<option value='${i}' ${(heapSelec && hv == i) && "selected"} title = "${sessionHistory[i].type} ${sessionHistory[i].date} ${sessionHistory[i].time}" > ${sessionHistory[i].name}</option > `;
        ground.innerHTML += `<option value='${i}' title = "${sessionHistory[i].type} ${sessionHistory[i].date} ${sessionHistory[i].time}" > ${sessionHistory[i].name}</option > `;
    }
}

function openGround_Fromlocal(e) {
    let files = e.target.files;
    if (files.length < 1) {
        return;
    }
    let file = files[0];
    let reader = new FileReader();
    let model_text;
    reader.addEventListener("load", () => {
        model_text = reader.result;
        cloudmachine.reloadGroundFromData(file.name, model_text);
        reloadHGlist(true);
    }, false);

    if (file) {
        reader.readAsText(file);
    }
}

function openNav() {
    document.getElementById("modellist").style.width = "250px";
    document.getElementById("core").style.marginRight = "250px";
}

function closeNav() {
    document.getElementById("modellist").style.width = "0";
    document.getElementById("core").style.marginRight = "0";
}

function inputedVolume() {
    let mass = parseFloat(document.getElementById('id-mass').value)
    document.getElementById('id-densty').value = mass * 1000 / parseFloat(document.getElementById('id-volume').value);
}

function inputedMass() {
    let volume = parseFloat(document.getElementById('id-volume').value)
    document.getElementById('id-densty').value = parseFloat(document.getElementById('id-mass').value) * 1000 / volume;
}

function inputedDensty() {
    let volume = parseFloat(document.getElementById('id-volume').value)
    document.getElementById('id-mass').value = parseFloat(document.getElementById('id-densty').value) * volume / 1000;
}

window.onload = function () {
    cloudmachine.init();
    cloudmachine.cloudController();
    // cloudmachine.preview('previewCanvas', 'previewParent');
    startApp();
    //app controller/////////////////////////////////////////////////////////////////////////////////////////////////////////
    $('#btn-openfromLocal').click(function () {
        btn_open_model();
    })

    $('#input_model').change(openModel_Fromlocal);

    document.getElementById('obj-download').addEventListener('click', () => {
        const result = cloudmachine.getObjDataOf2D()
        download('model.obj', 'object', result);
    })

    document.getElementById('obj-download3').addEventListener('click', () => {
        const result = cloudmachine.getObjDataOf3D()
        download('model(3Dmesh).obj', 'object', result);
    })

    document.getElementById('txt-download').addEventListener('click', () => {
        const result = cloudmachine.getTextData()
        download('model.txt', 'text', result);
    })

    document.getElementById('delaunyDiv').addEventListener('click', function () {
        let two = document.getElementById('delauny');
        if (!two.checked) {
            cloudmachine.set2dMeshVisibility(false);
        }
        else {
            cloudmachine.set2dMeshVisibility(true);
        };
    });

    document.getElementById('delaunyDiv3').addEventListener('click', function () {
        let two = document.getElementById('delauny3');
        if (!two.checked) {
            cloudmachine.set3dMeshVisibility(false);
        }
        else {
            cloudmachine.set3dMeshVisibility(true);
        };
    });

    document.getElementById('surfaceDiv').addEventListener('click', function () {
        let two = document.getElementById('surface');
        if (!two.checked) {
            cloudmachine.setMeshWireframe(true)
        }
        else {
            cloudmachine.setMeshWireframe(false)
        };
    });

    document.getElementById('heightmapColorDiv').addEventListener('click', function () {
        let two = document.getElementById('heightmapColor');
        if (!two.checked) {
            document.getElementById('pointcolor').disabled = false;
            cloudmachine.setHeightMapColor(false);
        }
        else {
            document.getElementById('pointcolor').disabled = true;
            cloudmachine.setHeightMapColor(true);
        };
    });

    document.getElementById('coordinateDiv').addEventListener('click', function () {
        let two = document.getElementById('coordinate');
        if (!two.checked) {
            cloudmachine.setCoordinate(false);
        }
        else {
            cloudmachine.setCoordinate(true);
        };
    });

    document.getElementById('gcsDiv').addEventListener('click', function () {

        let two = document.getElementById('gcs');
        if (!two.checked) {
            cloudmachine.deleteGlobalCoordinate();
        }
        else {
            cloudmachine.setGlobalCoordinate();
        };
    });

    document.getElementById('pointcolor').addEventListener('input', function () {
        cloudmachine.setPointColor(this.value)
    });

    document.getElementById('delaunycolor').addEventListener('input', function () {
        cloudmachine.setDelaunyColor(this.value)
    });

    document.getElementById('polygoncolor').addEventListener('input', function () {
        cloudmachine.polygonRender()
    });

    document.getElementById('polygonsize').addEventListener('input', function () {
        cloudmachine.polygonRender()
    });

    document.getElementById('selectedsize').addEventListener('input', function () {
        cloudmachine.setSelectedSize(this.value)
    });

    document.getElementById('selectedcolor').addEventListener('input', function () {
        cloudmachine.setSelectedColor(this.value)
    });

    document.getElementById('btn-rotate2').addEventListener('click', function () {
        document.getElementById('btn-' + cloudmachine.toolState).classList.remove('active')
        document.getElementById('btn-rotate2').classList.add('active')
        cloudmachine.setToolState('rotate2')
    });

    document.getElementById('btn-rotate3').addEventListener('click', function () {
        document.getElementById('btn-' + cloudmachine.toolState).classList.remove('active')
        document.getElementById('btn-rotate3').classList.add('active')
        cloudmachine.setToolState('rotate3')
    });

    document.getElementById('btn-reset').addEventListener('click', function () {
        document.getElementById('btn-' + cloudmachine.toolState).classList.remove('active')
        document.getElementById('btn-reset').classList.add('active')
        cloudmachine.setToolState('reset')
    });

    document.getElementById('btn-reset2').addEventListener('click', function () {
        document.getElementById('btn-' + cloudmachine.toolState).classList.remove('active')
        document.getElementById('btn-reset2').classList.add('active')
        cloudmachine.setToolState('reset2')
    });

    document.getElementById('btn-polyline').addEventListener('click', function () {
        document.getElementById('btn-' + cloudmachine.toolState).classList.remove('active')
        document.getElementById('btn-polyline').classList.add('active')
        cloudmachine.setToolState('polyline')
    });

    document.getElementById('btn-addpoint').addEventListener('click', function () {
        document.getElementById('btn-' + cloudmachine.toolState).classList.remove('active')
        document.getElementById('btn-addpoint').classList.add('active')
        cloudmachine.setToolState('addpoint')
    });

    document.getElementById('btn-cross').addEventListener('click', function () {
        document.getElementById('btn-' + cloudmachine.toolState).classList.remove('active')
        document.getElementById('btn-cross').classList.add('active')
        cloudmachine.setToolState('cross')
    });

    // document.getElementById('btn-translate2').addEventListener('click', function () {
    //     document.getElementById('btn-' + cloudmachine.toolState).classList.remove('active')
    //     document.getElementById('btn-translate2').classList.add('active')
    //     cloudmachine.transDir = document.getElementById('trans-axis2').value;
    //     cloudmachine.setToolState('translate2')
    // });

    document.getElementById('btn-point').addEventListener('click', function () {
        document.getElementById('btn-' + cloudmachine.toolState).classList.remove('active')
        document.getElementById('btn-point').classList.add('active')
        cloudmachine.setToolState('point')
    });

    document.getElementById('btn-polygon').addEventListener('click', function () {
        document.getElementById('btn-' + cloudmachine.toolState).classList.remove('active')
        document.getElementById('btn-polygon').classList.add('active')
        cloudmachine.setToolState('polygon')
    });

    document.getElementById('btn-pencil').addEventListener('click', function () {
        document.getElementById('btn-' + cloudmachine.toolState).classList.remove('active')
        document.getElementById('btn-pencil').classList.add('active')
        cloudmachine.setToolState('pencil')
    });

    document.getElementById('btn-translate').addEventListener('click', function () {
        document.getElementById('btn-' + cloudmachine.toolState).classList.remove('active')
        document.getElementById('btn-translate').classList.add('active')
        cloudmachine.transDir = document.getElementById('trans-axis').value;
        cloudmachine.setToolState('translate')
    });

    document.getElementById('trans-axis').addEventListener('change', function () {
        cloudmachine.transDir = this.value;
    })

    document.getElementById('cross-offset').addEventListener('change', function () {
        cloudmachine.updateCrossSection()
    })

    document.getElementById('cross-width').addEventListener('change', function () {
        cloudmachine.updateCrossSection()
    })

    document.getElementById('cross-offset').addEventListener('input', function () {
        cloudmachine.updateCrossSection()
    })

    document.getElementById('cross-width').addEventListener('input', function () {
        cloudmachine.updateCrossSection()
    })
    // document.getElementById('trans-axis2').addEventListener('change', function () {
    //     cloudmachine.transDir = this.value;
    // })

    document.getElementById('btn-lineTrans').addEventListener('click', function () {
        document.getElementById('btn-' + cloudmachine.toolState).classList.remove('active')
        document.getElementById('btn-lineTrans').classList.add('active')
        cloudmachine.setToolState('lineTrans')
    });

    document.getElementById('btn-rotate').addEventListener('click', function () {
        document.getElementById('btn-' + cloudmachine.toolState).classList.remove('active')
        document.getElementById('btn-rotate').classList.add('active')
        cloudmachine.setToolState('rotate')
    });

    document.getElementById('btn-check').addEventListener('click', function () {
        cloudmachine.setModelFromSelectedPoints();
    });

    document.getElementById('btn-change').addEventListener('click', function () {
        cloudmachine.changeBtnSU();
    });

    document.getElementById('btn-delete').addEventListener('click', function () {
        cloudmachine.deleteSelectedPoints();
    });

    document.getElementById('f1-filter').addEventListener('click', function () {
        startProgress()
        setTimeout(() => {
            cloudmachine.gridMinimumFilter(document.getElementById('f1-cell-size').value);
            endProgress()
        }, 20)
    });

    document.getElementById('f2-filter').addEventListener('click', function () {
        startProgress()
        setTimeout(() => {
            cloudmachine.voxelGridFilter(document.getElementById('f2-cell-size').value)
            endProgress()
        }, 20)
    })

    document.getElementById('f3-filter').addEventListener('click', function () {
        startProgress()
        setTimeout(() => {
            let num = document.getElementById('f3-number').value;
            let dev = document.getElementById('f3-deviation').value;
            cloudmachine.outlierRemovalFilter(num, dev)
            endProgress()
        }, 20)
    })

    document.getElementById('f4-filter').addEventListener('click', function () {
        startProgress()
        setTimeout(() => {
            let limit1 = document.getElementById('f4-limit1').value;
            let limit2 = document.getElementById('f4-limit2').value;
            let pass = document.getElementById('f4-pass').value;
            cloudmachine.passThroughFilter(pass, limit1, limit2)
            endProgress()
        }, 20)
    })

    document.getElementById('f1-mfilter').addEventListener('click', function () {
        startProgress()
        setTimeout(() => {
            cloudmachine.gridMinimumFilter(document.getElementById('f1-cell-size').value, false);
            endProgress()
        }, 20)
    });

    document.getElementById('f2-mfilter').addEventListener('click', function () {
        startProgress()
        setTimeout(() => {
            cloudmachine.voxelGridFilter(document.getElementById('f2-cell-size').value, false)
            endProgress()
        }, 20)
    })

    document.getElementById('f3-mfilter').addEventListener('click', function () {
        startProgress()
        setTimeout(() => {
            let num = document.getElementById('f3-number').value;
            let dev = document.getElementById('f3-deviation').value;
            cloudmachine.outlierRemovalFilter(num, dev, false)
            endProgress()
        }, 20)
    })

    document.getElementById('f4-mfilter').addEventListener('click', function () {
        startProgress()
        setTimeout(() => {
            let limit1 = document.getElementById('f4-limit1').value;
            let limit2 = document.getElementById('f4-limit2').value;
            let pass = document.getElementById('f4-pass').value;
            cloudmachine.passThroughFilter(pass, limit1, limit2, false)
            endProgress()
        }, 20)
    })

    document.getElementById('markedVolume').addEventListener('click', function () {
        if (this.checked) {
            document.getElementById('vheap-list').disabled = true;
            document.getElementById('btn-vSave').style.display = 'none';
        } else {
            document.getElementById('vheap-list').disabled = false;
            document.getElementById('btn-vSave').style.display = 'inline-block';
        }
    })

    document.getElementById('editArea').addEventListener('keypress', (e) => {
        console.log(e)
        if (e.keyCode == 26 && e.ctrlKey) {
            console.log('ctrl+z')
            cloudmachine.popupHistory(e);
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
            $("#btn-rotate2").trigger('click');
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
        else if (e.keyCode == 99) {
            $("#baseIcon-tab3").trigger("click");
            $("#btn-point").trigger('click');
        }
    }, false);

    document.getElementById('btn-directSave').addEventListener('click', () => {
        document.getElementById('ds-modelName').value = cloudmachine.groupList[cloudmachine.activeId[0]].name;
        document.getElementById('ds-modelVolume').value = cloudmachine.groupList[cloudmachine.activeId[0]].volume || 0;
    })

    document.getElementById('directSaveBtn').addEventListener('click', () => {
        let savedata = cloudmachine.getSavePoints();
        let matrix = cloudmachine.getSaveMatrixArray();
        const dateobj = new Date();
        let year = dateobj.getFullYear();
        let month = dateobj.getMonth() + 1;
        let date = dateobj.getDate();
        let hour = dateobj.getHours();
        let min = dateobj.getMinutes();
        let sec = dateobj.getSeconds();

        let db = document.getElementById('ds-database').value.trim();
        let col = document.getElementById('ds-collection').value.trim();
        if (db == "" || col == "") {
            alert('please enter database and collection name correctly.')
            return;
        }
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
                db: db,
                col: col,
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
                    "time": `${hour}:${min}:${sec}`,
                    "name": document.getElementById('ds-modelName').value,
                    "data": savedata,
                    "type": `model`,
                    "volume": document.getElementById('ds-modelVolume').value,
                    "matrix": matrix,
                }
            },
            type: "post"
        }).done((res) => {
            if (res.success)
                alert('successfully saved');
            else alert(res.error + "(saving failed)");
        }).fail(() => {
            alert('network error(saving failed)');
        })
    })
    let gdblist;
    document.getElementById('btn-emb').addEventListener('click', () => {
        $.ajax({
            url: "/data/getdatabaselist",
            type: "post"
        }).done((res) => {
            if (res.error) alert('db error');
            else if (res.success) {
                // console.log(res.data)
                let dblist = res.data;
                gdblist = dblist;
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
        let sessionHistory = cloudmachine.sessionHistory;
        for (let i = sessionHistory.length - 1; i >= 0; i--) {
            if (!sessionHistory[i].deleted) {
                htable.innerHTML += `<tr>
              <td style="width:180px;padding:10px;display:none;"><span id = "preview${i}" class="rect" style=""></span></td>
              <td data-id=${i} style="padding:0"><input title="${sessionHistory[i].name}" data-id=${i} class="m-namelist" style="border:0;padding:10px" value="${sessionHistory[i].name}"></td>
              <td>${sessionHistory[i].date}</td>
              <td>${sessionHistory[i].time}</td>
              <td>${sessionHistory[i].type}</td>
              <td>${sessionHistory[i].volume}</td>
              <td>${sessionHistory[i].mass}</td>
              <td>${sessionHistory[i].densty}</td>
              <td><button data-id=${i} class="matrixview btn btn-icon btn-outline-primary round btn-sm"
                    title='view and edit matrix' data-toggle="modal" data-target="#matrixModal" >matrix</button></td>
              <td style="width:230px;">
                <button data-id=${i} class="hload-btn btn btn-icon btn-outline-primary  round btn-sm"
                  title='loading'><i class="ft-upload"></i>
                </button>
                <button data-id=${i} class="hdown-btn btn btn-icon btn-outline-primary round btn-sm"
                    title='download model with txt file'><i class="ft-download"></i>
                </button>
                <button data-id=${i} class="hdel-btn btn btn-icon btn-outline-primary  round btn-sm"
                  title='delete'><i class="ft-x-square"></i>
                </button>
              </td>
            </tr>`;
            }
        }
        $('.hload-btn').click(function () {
            console.log({ this: this })
            // document.getElementById('modelpath').innerText = this.parentElement.parentElement.children[0].innerText;
            cloudmachine.reloadModelFromArray(sessionHistory[parseInt(this.dataset.id)].name, sessionHistory[parseInt(this.dataset.id)].data, sessionHistory[parseInt(this.dataset.id)].matrix);
            $('#browser-close').trigger('click');
        })
        $('.matrixview').click(function () {
            console.log({ this: this })
            let matrix = cloudmachine.sessionHistory[parseInt(this.dataset.id)].matrix;
            document.getElementById('matrix-id').value = parseInt(this.dataset.id);
            for (var i = 0; i < 16; i++) {
                document.getElementById('mtx' + i).innerText = matrix[i];
            }
        })
        $('.hdown-btn').click(function () {
            let array = sessionHistory[parseInt(this.dataset.id)].data;
            let matrix = sessionHistory[parseInt(this.dataset.id)].matrix;
            let result = cloudmachine.getTextData(array, matrix);
            download('model.txt', 'text', result);
        })
        $('.hdel-btn').click(function () {
            console.log({ this: this })
            sessionHistory[parseInt(this.dataset.id)].deleted = true;
            $(this.parentElement.parentElement).remove();
            // $('#browser-close').trigger('click');
        })
        $('.m-namelist').on('change', function () {
            cloudmachine.sessionHistory[parseInt(this.dataset.id)].name = this.value;
        })
        $('.m-namelist').on('input', function () {
            cloudmachine.sessionHistory[parseInt(this.dataset.id)].name = this.value;
        })
        // setTimeout(() => {
        //     for (let i = 0; i < sessionHistory.length; i++) {
        //         cloudmachine.previewCloud('preview' + i, sessionHistory[i].data)
        //     }
        // }, 1000)
    })

    document.getElementById('browser-load').addEventListener('click', () => {
        let id1 = document.getElementById('cdatabase-list').value;
        let id2 = document.getElementById('ccollection-list').value;
        let dblist = gdblist;
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
                        <td>${res.data[i].volume}</td>
                        <td>${res.data[i].mass}</td>
                        <td>${res.data[i].densty}</td>
                        <td ><button data-id=${i} class="dbmatrixview btn btn-icon btn-outline-primary round btn-sm"
                            title='view matrix' data-toggle="modal" data-target="#dbMatrix" >matrix</button></td>
                        <td style="width:170px;">
                            <button data-id=${i} type='button' class="dload-btn btn btn-icon btn-outline-primary  round btn-sm mr-1"
                            title='loading'><i class="ft-upload"></i>
                            </button>
                        </td>
                        </tr>`;
                }
                $('.dload-btn').click(function () {
                    console.log({ data: res.data })
                    // document.getElementById('modelpath').innerText = this.parentElement.parentElement.children[0].innerText;
                    cloudmachine.reloadModelFromArray(res.data[parseInt(this.dataset.id)].name, res.data[parseInt(this.dataset.id)].data, res.data[parseInt(this.dataset.id)].matrix);
                    $('#browser-close').trigger('click');
                })
                $('.dbmatrixview').click(function () {
                    console.log({ this: this })
                    let matrix = res.data[parseInt(this.dataset.id)].matrix;
                    for (var i = 0; i < 16; i++) {
                        document.getElementById('dbmtx' + i).innerText = matrix[i];
                    }
                })
            }
            else alert(res.error);
            // $('#browser-close').trigger('click');
        }).fail(() => {
            alert('network error');
            $('#browser-close').trigger('click');
        })
    })

    document.getElementById('btn-vol').addEventListener('click', () => {
        reloadHGlist();
    })

    document.getElementById('bhistory-tab').addEventListener('click', () => {
        document.getElementById('browser-save').style.display = 'inline-block';
    })

    document.getElementById('bdatabase-tab').addEventListener('click', () => {
        document.getElementById('browser-save').style.display = 'none';
    })

    document.getElementById('browser-save').addEventListener('click', () => {
        let database = document.getElementById('hdatabase-name').value.trim();
        let collection = document.getElementById('hcollection-name').value.trim();
        let sessionHistory = cloudmachine.sessionHistory;
        if (database == "" || collection == "") {
            alert('please enter database and collection name for saving.')
            return;
        }
        let savedata = [];
        let clonelist = document.getElementById('history-models').children;
        for (let i = 0; i < clonelist.length; i++) {
            let n = clonelist[i].children[1].dataset.id;
            // sessionHistory[n].name = clonelist[i].children[1].innerText.trim();
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
        }).fail(() => {
            alert('network error(saving failed)');
        })
        sessionHistory = sessionHistory.filter((e, id) => {
            return !e.deleted;
        })
    })

    document.getElementById('btn-ground').addEventListener('click', () => {
        $("#ground-file").trigger("click");
    })

    $('#ground-file').change(openGround_Fromlocal);

    document.getElementById('btn-volume').addEventListener('click', () => {
        let b = document.getElementById('markedVolume').checked;
        let volume;
        if (!b) {
            let h = document.getElementById('vheap-list').value;
            let v = document.getElementById('vground-list').value;
            volume = Math.abs(cloudmachine.calculateVolume(h, v));
        } else {
            let v = document.getElementById('vground-list').value;
            volume = Math.abs(cloudmachine.calculateVolume(undefined, v));
        }
        console.log('volume', volume)
        document.getElementById('id-volume').value = volume;
        inputedVolume();
        // $("#btn-vClose").trigger('click');
        // alert(volume)
    })

    document.getElementById('id-volume').addEventListener('change', function () {
        console.log('volume change')
        inputedVolume();
    })

    document.getElementById('id-volume').addEventListener('input', function () {
        console.log('volume input')
        inputedVolume();
    })

    document.getElementById('id-mass').addEventListener('change', function () {
        console.log('mass change')
        inputedMass();
    })

    document.getElementById('id-mass').addEventListener('input', function () {
        console.log('mass input')
        inputedMass();
    })

    document.getElementById('id-densty').addEventListener('change', function () {
        console.log('densty change')
        inputedDensty()
    })

    document.getElementById('id-densty').addEventListener('input', function () {
        console.log('densty input')
        inputedDensty()
    })

    document.getElementById('btn-vSave').addEventListener('click', function () {
        console.log('volume saved')
        let id = document.getElementById('vheap-list').value;
        let v = document.getElementById('id-volume').value;
        let m = document.getElementById('id-mass').value;
        let d = document.getElementById('id-densty').value;

        cloudmachine.setVolumeMassDensty(id, v, m, d)
        alert('success')

    })

    document.getElementById('absTranslate').addEventListener('click', () => {
        let x = document.getElementById('trans-x').value;
        let y = document.getElementById('trans-y').value;
        let z = document.getElementById('trans-z').value;
        cloudmachine.translateAbs(x, y, z)
    })

    document.getElementById('absRotate').addEventListener('click', () => {
        let axis = document.getElementById('rotate-pass').value;
        let degree = document.getElementById('rotate-degree').value * Math.PI / 180;
        cloudmachine.rotateAbs(axis, degree)
    })

    document.getElementById('flip-left').addEventListener('click', () => {
        let axis = document.getElementById('flip-pass').value;
        let degree = Math.PI / 2;
        cloudmachine.rotateAbs(axis, degree)
    })

    document.getElementById('flip-right').addEventListener('click', () => {
        let axis = document.getElementById('flip-pass').value;
        let degree = -Math.PI / 2;
        cloudmachine.rotateAbs(axis, degree)
    })

    document.getElementById('set-matrix').addEventListener("click", function (event) {
        cloudmachine.setCurrentMatrix();
        alert('success')
    });

    document.getElementById('matrix-save').addEventListener('click', function () {
        let array = [$('#mtx0').text(), $('#mtx1').text(), $('#mtx2').text(), $('#mtx3').text(), $('#mtx4').text(), $('#mtx5').text(), $('#mtx6').text(), $('#mtx7').text(), $('#mtx8').text(), $('#mtx9').text(), $('#mtx10').text(), $('#mtx11').text(), $('#mtx12').text(), $('#mtx13').text(), $('#mtx14').text(), $('#mtx15').text(),]
        let id = document.getElementById('matrix-id').value;
        cloudmachine.setMatrixToHistory(id, array)
        $('#matrix-close').trigger('click')
        alert('success')
    })

    document.getElementById('matrix-download').addEventListener('click', () => {
        let text = `${$('#mtx0').text()} ${$('#mtx4').text()} ${$('#mtx8').text()} ${$('#mtx12').text()}\n${$('#mtx1').text()} ${$('#mtx5').text()} ${$('#mtx9').text()} ${$('#mtx13').text()}\n${$('#mtx2').text()} ${$('#mtx6').text()} ${$('#mtx10').text()} ${$('#mtx14').text()}\n${$('#mtx3').text()} ${$('#mtx7').text()} ${$('#mtx11').text()} ${$('#mtx15').text()}`;
        download('matrix.txt', 'text', text);
    })

    document.getElementById('dbmatrix-download').addEventListener('click', () => {
        let text = `${$('#dbmtx0').text()} ${$('#dbmtx4').text()} ${$('#dbmtx8').text()} ${$('#dbmtx12').text()}\n${$('#dbmtx1').text()} ${$('#dbmtx5').text()} ${$('#dbmtx9').text()} ${$('#dbmtx13').text()}\n${$('#dbmtx2').text()} ${$('#dbmtx6').text()} ${$('#dbmtx10').text()} ${$('#dbmtx14').text()}\n${$('#dbmtx3').text()} ${$('#dbmtx7').text()} ${$('#dbmtx11').text()} ${$('#dbmtx15').text()}`;
        download('matrix.txt', 'text', text);
    })

    document.getElementById('baseIcon-tab5').addEventListener('click', () => {
        cloudmachine.setFromRealMatrix();
    })

    //drag and drop
    // While dragging the p element, change the color of the output text
    document.addEventListener("drag", function (event) {
        document.getElementById("viewer_3d").style.color = "red";
    });

    // Output some text when finished dragging the p element and reset the opacity
    document.addEventListener("dragend", function (event) {
        document.getElementById("viewer_3d").innerHTML = "Finished dragging the p element.";
        cloudmachine.canvas.style.opacity = "1";
    });

    /* Events fired on the drop target */

    // When the draggable p element enters the droptarget, change the DIVS's border style
    document.addEventListener("dragenter", function (event) {
        if (event.target.className == "dviewer") {
            cloudmachine.canvas.style.border = "3px dotted red";
        }
    });

    // By default, data/elements cannot be dropped in other elements. To allow a drop, we must prevent the default handling of the element
    document.addEventListener("dragover", function (event) {
        event.preventDefault();
    });

    // When the draggable p element leaves the droptarget, reset the DIVS's border style
    document.addEventListener("dragleave", function (event) {
        if (event.target.className == "dviewer") {
            cloudmachine.canvas.style.border = "";
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
            cloudmachine.canvas.style.border = "";
            let file = event.dataTransfer.files[0];
            let reader = new FileReader();
            reader.onload = function (ev) {
                let model_text = ev.target.result;
                if (file.name.split('.').pop() == 'obj') {
                    cloudmachine.reloadModelFromObjData(file.name, model_text)
                }
                else {
                    cloudmachine.reloadModelFromData(file.name, model_text);
                }
            };

            reader.readAsText(file);
        }
    });

    $('a[data-action="expand"]').on('click', async function (e) {
        await new Promise(r => setTimeout(r, 10));
        cloudmachine.windowResize();
    });

    document.getElementById('sidenav').addEventListener('click', function () {
        cloudmachine.polygon = [];
        cloudmachine.polygonRender();
        if (document.getElementById("core").style.marginRight == "0px") {
            openNav()
        } else {
            closeNav()
        }
        setTimeout(() => { cloudmachine.windowResize() }, 500)
    })

    document.getElementById('expand').addEventListener('click', expand)
};
