import * as THREE from './three.module.js';
import { owlStudio } from './owlStudio.js';
import { timelapsLib } from './timelapsLib.js';

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
            cloudmachine.setCameraPosition(new THREE.Vector3().copy(target.group.position).applyMatrix4(cloudmachine.oscene.matrix))
        } else {
            cloudmachine.setCameraPosition(new THREE.Vector3().copy(target.group.position).applyMatrix4(cloudmachine.oscene.matrix))
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
        cloudmachine.setGlobalCoordinate()
    } else {
        const loader = new THREE.FileLoader();
        loader.load('./3dmodels/Weissspat_1632872292.txt', (text) => {
            cloudmachine.reloadModelFromData('Weissspat_1632872292.txt', text);
            cloudmachine.setGlobalCoordinate()
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
        // const result = cloudmachine.getObjDataOf2D()
        const result = cloudmachine.getObjData()
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

    document.getElementById('pointsize').addEventListener('input', function () {
        cloudmachine.setPointSize(this.value)
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
        // else if (e.keyCode == 87 && e.shiftKey) {
        //     console.log(2)
        //     $("#delauny3").trigger('click');
        // }
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
        const htable = document.getElementById('cardcollapse');
        htable.innerHTML = '';
        let sessionHistory = cloudmachine.sessionHistory;
        for (let i = sessionHistory.length - 1; i >= 0; i--) {
            if (!sessionHistory[i].deleted) {
                let hg = sessionHistory[i];
                if ($(`#history-models${hg.id}`).length === 0) {
                    $('#cardcollapse').append(`
                        <div class="card">
                        <div class="card-header">
                        <h5 class="mb-0">
                            <button class="btn btn-link" data-toggle="collapse" data-target="#collapse${hg.id}"
                            aria-expanded="false" aria-controls="collapse">
                            ${hg.filename}
                            </button>
                        </h5>
                        </div>

                        <div id="collapse${hg.id}" class="collapse">
                            <div class="card-body">
                                <table class="table mb-0" style="table-layout: fixed;">
                                <tbody id="history-models${hg.id}">
                                    
                                </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    `)
                }
                $(`#history-models${hg.id}`).append(`<tr>
                    <td style="width:180px;padding:10px;display:none;"><span id = "preview${i}" class="rect" style=""></span></td>
                    <td data-id=${i} style="width:205px;padding:0"><input title="${sessionHistory[i].name}" data-id=${i} class="m-namelist" style="border:0;padding:10px" value="${sessionHistory[i].name}"></td>
                    <td>${sessionHistory[i].date}</td>
                    <td>${sessionHistory[i].time}</td>
                    <td>${sessionHistory[i].type}</td>
                    <td>${sessionHistory[i].volume}</td>
                    <td>${sessionHistory[i].mass}</td>
                    <td>${sessionHistory[i].densty}</td>
                    <td><button data-id=${i} class="matrixview btn btn-icon btn-outline-primary round btn-sm"
                            title='view and edit matrix' data-toggle="modal" data-target="#matrixModal" >matrix</button></td>
                    <td style="width:205px;">
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
                </tr>`);
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
        let clonelist = $('#cardcollapse tr');
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

    document.getElementById('cross-plane').addEventListener('change', function () {
        if (cloudmachine.clipGrid) {
            // cloudmachine.initDraw()
            cloudmachine.getCrossSection(cloudmachine.clipPoints[0], cloudmachine.clipPoints[1], false)
            cloudmachine.render()
        }
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

    function timelapsEngine() {

        let modelname, from, to, delauny, surface, color, heightmap, length;

        function currentState() {
            modelname = document.getElementById('models').value;
            from = document.getElementById('fromT').value;
            to = document.getElementById('toT').value;
            delauny = document.getElementById('delaunyT').checked;
            surface = document.getElementById('surfaceT').checked;
            color = document.getElementById('colorT').value;
            heightmap = document.getElementById('heightmapT').checked;
            length = document.getElementById('secondT').value;
        }
        currentState()

        const timelaps = new timelapsLib('canvasT', 'parentcanvasT', delauny, surface, color, heightmap)
        // document.getElementById('models').addEventListener('change', function(){

        // })
        // document.getElementById('fromT').addEventListener('change', function(){

        // })
        // document.getElementById('toT').addEventListener('change', function(){

        // })
        document.getElementById('delaunyTT').addEventListener('click', function () {
            timelaps.delauny(document.getElementById('delaunyT').checked)
        })
        document.getElementById('surfaceTT').addEventListener('click', function () {
            timelaps.surface(document.getElementById('surfaceT').checked)
        })
        document.getElementById('colorT').addEventListener('input', function () {
            timelaps.color(this.value)
        })
        document.getElementById('heightmapTT').addEventListener('click', function () {
            timelaps.heightmap(document.getElementById('heightmapT').checked)
        })
        // document.getElementById('secondT').addEventListener('change', function(){

        // })
        document.getElementById('loadT').addEventListener('click', function () {
            setLoading()
            currentState()
            timelaps.setParams(delauny, surface, color, heightmap)

            from = document.getElementById('fromT').value;
            to = document.getElementById('toT').value;
            if (!from || !to) {
                alert('please enter date correctly.')
                return;
            }
            console.log(from, to)
            let modelname = document.getElementById('models').value;
            Tfilename = modelname;
            let loadedmodel = JSON.parse(document.getElementById('loadedmodel').value);
            console.log(loadedmodel)
            let models = [];
            if (loadedmodel == '') location.href = '/data';
            loadedmodel.map((e) => {
                if (e.name == modelname) models.push(e._id)
            })
            if (models.length === 0) return;
            // Tfilename = 'testmodel';
            // models = [
            //     '61a69efe79610000df00437e',
            //     '61a69b7a042c00003d00481e',
            //     '61a697f64960000095003cbe',
            //     '61a69472b44000002f007a1e',
            //     '61a690ee352300003700066e',
            //     '61a68d6aa6520000aa0047ae',
            //     '61a689e67a7b000018001c1e',
            //     '61a6866226590000c0005cee',
            //     '61a682de1c2e0000ac0058de',
            //     '61a67f5aef1a000026004cbe',
            //     '61a67bd6413c00005b00235e',
            //     '61a67852ad14000071007b6e',
            //     '61a674cf576400000c000cde',
            //     '61a67149df3200006600584e',
            //     '61a66dc66b090000d8007a7e',
            //     '61a66a42f04f0000090005be',
            //     '61a666bec862000075004aae',
            //     '61a6633a310f00004d0075be',
            //     '61a65fb6ac720000a6003fee',
            //     '61a65c32f45100005700708e',
            //     '61a658aea235000060007a7e',
            //     '61a6552ad80700005c002fde',
            //     '61a651a63d2b0000ef0015fe',
            //     '61a64e22fe0d00006c0011ae',
            //     '61a64a9e696700000e0074ee',
            //     '61a6471ad6270000e100645e',
            //     '61a64396220f0000c8001cce',
            //     '61a64012ff5600001c00544e',
            //     '61a63c8ef6360000ac001bfe',
            //     '61a6390a7c4e00002b00528e',
            //     '61a63586093b0000ba00552e',
            //     '61a63202112e0000790022ce',
            //     '61a62e7dc556000003004e5e',
            //     '61a62afa0c240000a30024ce',
            //     '61a62775fb5400008f003bfe',
            //     '61a623f109200000b4000dde',
            //     '61a6206e41500000380060ae',
            //     '61a61ce934560000da001c2e',
            //     '61a6196622540000e600712e',
            //     '61a615e2ca560000610038ee',
            //     '61a6125d6c0d000027004f2e',
            //     '61a60ed9ea620000ef00059e',
            //     '61a60b55dd230000f80054ae',
            //     '61a607d1e806000075002ece',
            //     '61a6044e8b7f00009f002b9e',
            //     '61a600c9c93800004a0008ce',
            //     '61a5fd45b51f000032005a0e',
            //     '61a5f9c1fa060000da00626e',
            //     '61a5f63de46c00004e00340e',
            //     '61a5e82d023d00001400225e',
            //     '61a5e7d29972000076005ece',
            //     '61a5e7b69972000076005e9e',
            //     '61a5e77a9972000076005e6e',
            //     '61a5e7479972000076005e3e',
            //     '61a5e5ccf8620000cb00181a',
            //     '61a5e446f8620000cb0017ea',
            //     '61a5e414f8620000cb0017bc',
            //     '61a5e3ae75250000040024f8',
            //     '61a5e38575250000040024ca',
            //     '61a5e2d3752500000400249c',
            //     '61a5e2a0c6360000fc001e58',
            //     '61a5e22ac6360000fc001e2a',
            //     '61a5e208c6360000fc001dfc',
            //     '61a5e0e82d52000041007c8c',
            //     '61a5e01f1a46000034004666',
            //     '61a5dfa41a46000034004638',
            //     '61a5df5b1a4600003400460a',
            //     '61a5de641a460000340045dc',
            //     '61a5dcbfe928000017006a42',
            //     '61a5dc99e928000017006a14',
            //     '61a5db5be9280000170069e6',
            //     '61a5dafce9280000170069b8',
            //     '61a5da88e92800001700698a',
            //     '61a5d87ce92800001700695c',
            //     '61a5d56cdd1700001b004acc',
            //     '61a5d1e8f0380000e20015ec',
            //     '61a5ce64af5d0000270021ec',
            //     '61a5cae08957000016000a0c',
            //     '61a5c75cb53200002900704c',
            //     '61a5c3d8d7570000240071fc',
            //     '61a5c055a86f0000b700687c',
            //     '61a4cf38b677000098001164',
            //     '61a4c128b677000098001136',
            //     '61a4b318b677000098001108',
            //     '61a4a507b6770000980010da',
            //     '61a48fd8b6770000980010ac',
            //     '61a488e8f74700000100061c',
            //     '61a47ad9a53600001b00764c',
            //     '61a46cc8ff1c00007a00009c',
            //     '61a45eb9f01f00005a005d8c',
            //     '61a450a87d15000031004f4c',
            //     '61a44299354600002e00386c',
            //     '61a43489ce0f0000e10071bc',
            //     '61a42678441f00003100550c',
            //     '61a41869135f0000f500305c',
            //     '61a40a59ae0e0000210071bc',
            //     '61a2fee7f73000008500133c',
            //     '61a2f0d7d46b00007a00058c',
            //     '61a1ad605d5e00005a00060c',
            //     '61a19f50b56b00009c0055ac',
            // ];
            $.ajax({
                url: "/data/getmodels",
                type: "post",
                data: { data: models, from: from, to: to }
            }).done((res) => {
                closeLoading()
                if (res.status)
                    timelaps.setModel(res.data)
                else alert('database error')
            })
        })

        document.getElementById('createT').addEventListener('click', function () {
            setLoading();
            let images = timelaps.getImages();
            if (images && images.length !== 0)
                finalizeVideo(images)
            // closeLoading();
            // let conv = new Whammy.Video(3);
            // for (let image of images) {
            //     conv.add(image);
            // }
            // conv.compile(false, function(blob){
            //     var reader = new FileReader();
            //     reader.readAsDataURL(blob);
            //     reader.onloadend = function () {
            //         var base64data = reader.result;
            //         console.log(base64data);
            //         document.getElementById('videoT').src = base64data;
            //     }
            // })
            // var encoder = new GIFEncoder();
            // encoder.setRepeat(0);
            // encoder.setDelay(500);
            // encoder.start();
            // for (let image of images) {
            //     encoder.addFrame(binarytoimagedata(image), true);
            // }
            // encoder.finish();
            // var binary_gif = encoder.stream().getData() //notice this is different from the as3gif package!
            // var data_url = 'data:image/gif;base64,' + encode64(binary_gif);
            // console.log(data_url)


        })




    }




    timelapsEngine();
};


function setLoading() {
    console.log('setLoading')
    if($('#cloading').length == 0)
        $('#Tmodelcontent').append(`
            <div id="cloading" style="
                position: fixed;
                z-index: 10000;
                background: #00000073;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;">
                <img src="img/loading.gif" style="
                    margin: auto;
                    position: absolute;
                    top: 50%;
                    transform: translate(-50%, -50%);left: 50%;"
                >
            </div>
        `)
}

function closeLoading() {
    console.log('closeLoading')
    $('#cloading').remove();
}

function binarytoimagedata(b) {
    let img = document.createElement('img')
    img.onload = function () {

    }
    img.src = b;
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0);
    var myData = context.getImageData(0, 0, img.width, img.height);
    return myData;
}
const worker = new Worker('/js/ffmpeg-worker-mp4.js')
var start_time;
function finalizeVideo(imgs) {
    setLoading();
    let images = [];
    for (let img of imgs) {
        const data = convertDataURIToBinary(img)
        images.push({
            name: `img${pad(images.length, 3)}.jpeg`,
            data: data
        })
    }
    let times = document.getElementById('secondT').value;
    let length = images.length;
    let frames = parseInt(length / times);

    start_time = +new Date;

    let messages = '';

    worker.onmessage = function (e) {
        try {

            var msg = e.data;
            switch (msg.type) {
                case "stdout":
                case "stderr":
                    messages += msg.data + "\n";
                    break;
                case "exit":
                    console.log("Process exited with code " + msg.data);
                    //worker.terminate();
                    break;

                case 'done':
                    console.log(e)
                    const blob = new Blob([msg.data.MEMFS[0].data], {
                        type: "video/mp4"
                    });
                    done(blob)

                    break;
            }
            // alert(messages)
        } catch {
            closeLoading()
        }

    };

    // https://trac.ffmpeg.org/wiki/Slideshow
    // https://semisignal.com/tag/ffmpeg-js/
    console.log(frames)
    worker.postMessage({
        type: 'run',
        TOTAL_MEMORY: 805306368,
        //arguments: 'ffmpeg -framerate 24 -i img%03d.jpeg output.mp4'.split(' '),
        arguments: ["-r", `${frames}`, "-i", "img%03d.jpeg", "-c:v", "libx264", "-crf", "1", "-vf", "scale=1920:1080", "-pix_fmt", "yuv420p", "-vb", "20M", "out.mp4"],
        //arguments: '-r 60 -i img%03d.jpeg -c:v libx264 -crf 1 -vf -pix_fmt yuv420p -vb 20M out.mp4'.split(' '),
        MEMFS: images
    });

}

function done(output) {

    const url = webkitURL.createObjectURL(output);

    var end_time = +new Date;
    alert("Compiled Video in " + (end_time - start_time) + "ms, file size: " + Math.ceil(output.size / 1024) + "KB");
    // $('#videoT').src = url; //toString converts it to a URL via Object URLs, falling back to DataURL
    // $('#downloadT').href = url;

    var reader = new FileReader();
    reader.readAsDataURL(output);
    reader.onloadend = function () {
        var base64data = reader.result;
        // console.log(base64data);
        document.getElementById('videoT').src = base64data;
        document.getElementById('downloadT').setAttribute('href', base64data);

        const dataobj = new Date();
        let year = dataobj.getFullYear();
        let month = dataobj.getMonth() + 1;
        let date = dataobj.getDate();

        document.getElementById('downloadT').setAttribute('download', Tfilename + `_${year}-${month}-${date}`);
        closeLoading()
    }
}
let Tfilename;
function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function convertDataURIToBinary(dataURI) {
    var base64 = dataURI.replace(/^data[^,]+,/, '');
    var raw = window.atob(base64);
    var rawLength = raw.length;

    var array = new Uint8Array(new ArrayBuffer(rawLength));
    for (let i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
    }
    return array;
};