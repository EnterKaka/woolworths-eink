import * as THREE from "./three.module.js";
import { OrbitControls } from "./OrbitControls.js";
import {XYZLoader, getminmaxhegiht, getrgb,init_highlow} from "./XYZLoader.js";

var controls, camera, renderer, scene, canvas, parent_canvas, group; // chart global list
var chartlist, chartnamelist;
var before_canvas = '';
function init_chart() {
    chartlist = [];
    chartnamelist = [];
    let names = document.getElementById("input-names").value;
    names = names.split(",");
    for (const name of names) {
        let canvasname = "canvas-model-" + name;
        let inputname = "input-model-" + name;
        let ctx = document.getElementById(canvasname);
        let data = document.getElementById(inputname).value;
        data = JSON.parse(data);
        let filterdata = [];
        if($('#y_axis_value-' + name).children('input').val()){
            let y_axis = JSON.parse($('#y_axis_value-' + name).children('input').val());
            if(y_axis.option*1 == 2){
                data.log.forEach((ele)=>{
                    if(ele.volume >= 0)
                        filterdata.push(ele);
                });
                data.log = filterdata;
            }else if(y_axis.option*1 == 3){
                data.log.forEach((ele)=>{
                    if(ele.volume >= y_axis.min*1 && y_axis.max*1>= ele.volume)
                        filterdata.push(ele);
                });
                data.log = filterdata;
            }
        }
        drawChart(ctx, data);
    }
}

async function updateGraph(id, flag) {
    let tt = new Date();
    let ft;
    switch(flag){
        case "1week" :
            ft = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
            break;
        case "1month" :
            ft = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
            break;
        case "3month" :
            ft = new Date(Date.now() - (90 * 24 * 60 * 60 * 1000));
            break;
        case "1year" :
            ft = new Date(Date.now() - (365 * 24 * 60 * 60 * 1000));
            break;
        case "ytd" :
            ft = new Date(tt.getFullYear(), 0, 1)
            break;
        default :
            ft = new Date('2000-01-01 00:00:00');
            break;
    }
    let canvasname = "canvas-model-" + id;
    let inputname = "input-model-" + id;
    let parent = $("#" + canvasname).parent();
    let ctx = document.getElementById(canvasname);
    ctx.remove();
    await parent.append(
        '<canvas id="' + canvasname + '" style="height:300px"><canvas>'
    );
    ctx = document.querySelector("#" + canvasname);
    let data = document.getElementById(inputname).value;
    data = JSON.parse(data);
    let filterdata = [];
    if($('#y_axis_value-' + id).children('input').val()){
        let y_axis = JSON.parse($('#y_axis_value-' + id).children('input').val());
        if(y_axis.option*1 == 2){
            data.log.forEach((ele)=>{
                if(ele.volume >= 0)
                    filterdata.push(ele);
            });
            data.log = filterdata;
        }else if(y_axis.option*1 == 3){
            data.log.forEach((ele)=>{
                if(ele.volume >= y_axis.min*1 && y_axis.max*1>= ele.volume)
                    filterdata.push(ele);
            });
            data.log = filterdata;
        }
    }
    drawChart(ctx, data, ft, tt);
}

//draw chart
function drawChart(ctx, data, ft, tt) {
    // initialize chart option
    let y_axis = $('#y_axis_value-' + data.name).children('input').val();
    let zero = {
        ticks:{
            // scaleOverride: true,
            // scaleStartValue: 0,
            // beginAtZero: false,
            callback: function (value, index, values) {
                return parseInt(value*100)/100 + ' m³';
            },
        }
    };
    if(y_axis){
        y_axis = JSON.parse(y_axis);
        if(y_axis.option*1 == 2)
            zero = {
                suggestedMin:0,
                ticks:{
                    // scaleOverride: true,
                    // scaleStartValue: 0,
                    // beginAtZero: false,
                    callback: function (value, index, values) {
                        return parseInt(value*100)/100 + ' m³';
                    },
                }
            };
        if(y_axis.option*1 == 3)
            zero = {
                suggestedMin: y_axis.min,
                suggestedMax: y_axis.max,
                ticks:{
                    // scaleOverride: true,
                    // scaleStartValue: 0,
                    // beginAtZero: false,
                    callback: function (value, index, values) {
                        return parseInt(value*100)/100 + ' m³';
                    },
                }
            };
    }
    var chartOptions = {
        maintainAspectRatio: false,
        responsive: true,
        interaction: {
            intersect: false,
            mode: "index",
        },
        plugins: {
            legend: {
                display: false,
                position: "top",
            },
            title: {
                display: false,
                text: data.name,
                font: {
                    family: "Times",
                    size: 20,
                    lineHeight: 1.2,
                },
            },
            tooltip: {
                position: "nearest",
                callbacks: {
                    label: function(tooltipItem) {
                        var label = tooltipItem.dataset.label || '';
    
                        if (label) {
                            label += ': ';
                        }
                        label += Math.round(tooltipItem.parsed.y * 100) / 100 + '  m³';
                        return label;
                    }
                }
            },
        },
        scales: {
            x: {
                display: true,
                reverse: true,
                ticks: {
                    autoSkip: true,
                    maxRotation: 0,
                    minRotation: 0,
                    maxTicksLimit: 5,
                    callback: function (value, index, values) {
                        let monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                        var d = new Date(this.getLabelForValue(value));
                        return d.getDate() + "." + monthNames[d.getMonth()];
                    },
                },
            },
            y:zero,
        },
    };
    if (!ft) {
        // Chart Data
        var tempdata = makeChartDataFromModelSets(data);
        var chartData = {
            labels: tempdata[0],
            datasets: [
                {
                    label: "Volume",
                    data: tempdata[1],
                    lineTension: 0,
                    fill: false,
                    borderColor: "#FFAA4E",
                    pointStyle: null,
                    pointHoverBackgroundColor: "#FFF",
                    pointBorderWidth: 0,
                    pointHoverBorderWidth: 4,
                },
            ],
        };

        var config = {
            type: "line",
            // Chart Options
            options: chartOptions,
            data: chartData,
        };

        // Create the chart
        var lineChart = new Chart(ctx, config);
        chartlist.push(lineChart);
        chartnamelist.push(data.name);

        //set necessay extra information
        let lm_date = "lm-date-" + data.name,
            lm_time = "lm-time-" + data.name,
            lm_volume = "lm-volume-" + data.name,
            lm_mass = "lm-mass-" + data.name,
            lm_density = "lm-density-" + data.name,
            lm_avervol = "lm-averagevolume-" + data.name,
            inputmodelid = "input-modelid-" + data.name,
            week_1 = "1week-" + data.name,
            month_1 = "1month-" + data.name,
            month_3 = "3month-" + data.name,
            year_1 = "1year-" + data.name,
            ytd = "ytd-" + data.name;

        lm_date = document.getElementById(lm_date);
        lm_time = document.getElementById(lm_time);
        lm_volume = document.getElementById(lm_volume);
        lm_mass = document.getElementById(lm_mass);
        lm_density = document.getElementById(lm_density);
        lm_avervol = document.getElementById(lm_avervol);
        inputmodelid = document.getElementById(inputmodelid);

        week_1 = document.getElementById(week_1);
        month_1 = document.getElementById(month_1);
        month_3 = document.getElementById(month_3);
        year_1 = document.getElementById(year_1);
        ytd = document.getElementById(ytd);
        
        lm_date.innerHTML = tempdata[2];
        lm_time.innerHTML = tempdata[3];
        lm_volume.innerHTML = tempdata[4];
        lm_mass.innerHTML = tempdata[5];
        lm_density.innerHTML = tempdata[6];
        lm_avervol.innerHTML = tempdata[7];
        inputmodelid.value = tempdata[8];
        update_lastidofmodel(data.name, tempdata[11]);
        /*
            date button click
        */
        week_1.onclick = function() {
            updateGraph(this.id.substr(this.id.lastIndexOf("1week-") + 6), '1week');
        };
        month_1.onclick = function() {
            updateGraph(this.id.substr(this.id.lastIndexOf("1month-") + 7), '1month');
        };
        month_3.onclick = function() {
            updateGraph(this.id.substr(this.id.lastIndexOf("3month-") + 7), '3month');
        };
        year_1.onclick = function() {
            updateGraph(this.id.substr(this.id.lastIndexOf("1year-") + 6), '1year');
        };
        ytd.onclick = function() {
            updateGraph(this.id.substr(this.id.lastIndexOf("ytd-") + 4), 'ytd');
        };
    } else {
        // Chart Data
        var tempdata = makeChartDataFromModelSetsWithRange(data, ft, tt);
        var chartData = {
            labels: tempdata[0],
            datasets: [
                {
                    label: "Volume",
                    data: tempdata[1],
                    lineTension: 0,
                    fill: false,
                    borderColor: "#FFAA4E",
                    pointStyle: null,
                    pointHoverBackgroundColor: "#FFF",
                    pointBorderWidth: 0,
                    pointHoverBorderWidth: 4,
                },
            ],
        };

        var config = {
            type: "line",
            // Chart Options
            options: chartOptions,
            data: chartData,
        };

        // Create the chart
        try {
            var i;
            for (const element of chartlist) {i = 0;}
            var lineChart = new Chart(ctx, config);
        } catch (err) {
            console.log(err);
        }

        update_lastidofmodel(data.name, tempdata[2]);
    }
    //ondblclick listener
    let time_stamp = 0; // Or Date.now()
    ctx.addEventListener("touchstart",async function (event_) {
        if (event_.timeStamp - time_stamp < 300) {
            // A tap that occurs less than 300 ms from the last tap will trigger a double tap. This delay may be different between browsers.
            event_.preventDefault();
            var viewer = document.getElementById('viewer_3d');
            var close = document.getElementsByClassName('view_close');
            if(close.length){
                $(close).remove();
            }    
            $(viewer).remove();
            var this_canvas = $(this).attr("id");
            this_canvas = this_canvas.split("canvas-model-");
            var this_canvas_modelname = "input-modelid-" + this_canvas.slice(-1);
            this_canvas_modelname = document.getElementById(this_canvas_modelname).value;
            init_highlow();
            main();
            animate();
            load3dmodelwithidonlocal(this_canvas.slice(-1), this_canvas_modelname);
            return false;
        }
        time_stamp = event_.timeStamp;
    });

    ctx.addEventListener("dblclick",async function (evt) {
        //go to 3d viewer with last id
        var fff = false;
        var x, z, camera_x, camera_y, camera_z, control_x, control_y, control_z;
        if(typeof group != 'undefined'){
            z = group.rotation.z;
            x = group.rotation.x;
            camera_x = camera.position.x;
            camera_y = camera.position.y;
            camera_z = camera.position.z;
            control_x = controls.target.x;
            control_y = controls.target.y;
            control_z = controls.target.z;
            fff = true;
        }
        var viewer = document.getElementById('viewer_3d');
        var close = document.getElementsByClassName('view_close');
        if(close.length){
            $(close).remove();
        }
        viewer.parentNode.removeChild(viewer);
        var this_canvas = $(this).attr("id");
        this_canvas = this_canvas.split("canvas-model-");
        var canvas_name = this_canvas.slice(-1)[0];
        $('#input-model-'+canvas_name).parent().append("<canvas id='viewer_3d' class='3dviewer' style='margin-top:20px;'></canvas><i class='fa fa-close view_close'></i>");
        $(this).parent().parent().parent().parent().find('.view_panel').show();
        var this_canvas_totalmodel = "input-model-" + canvas_name;
        var this_canvas_modelname = "input-modelid-" + canvas_name;
        const points = lineChart.getElementsAtEventForMode(evt, "nearest", lineChart.options);
        if (points.length) {
            const firstPoint = points[0];
            const label = lineChart.data.labels[firstPoint.index];
            var totalmodel = JSON.parse(document.getElementById(this_canvas_totalmodel).value).log;
            let obj = totalmodel.find((o) => {
                if (o.datetime.toString() === label) return true;
            });
            this_canvas_modelname = obj._id;
            let lm_date = "lm-date-" + data.name,
            lm_time = "lm-time-" + data.name,
            lm_volume = "lm-volume-" + data.name,
            lm_mass = "lm-mass-" + data.name;
            var datetime = obj.datetime.split(' ');
            document.getElementById(lm_date).innerHTML = datetime[0];
            document.getElementById(lm_time).innerHTML = datetime[1];
            document.getElementById('delete_singleid-' + data.name).value = obj._id;
            document.getElementById(lm_volume).innerHTML = Math.round(obj.volume*100)/100;
            document.getElementById(lm_mass).innerHTML = Math.round(obj.mass*100)/100;
        } else {
            this_canvas_modelname = document.getElementById(this_canvas_modelname).value;
        }
        init_highlow();
        await main();
        await animate();
        if(fff&&before_canvas == canvas_name){
            group.rotation.z = z;
            group.rotation.x = x;
            await camera.position.set(camera_x, camera_y, camera_z);
            await controls.target.set(control_x, control_y, control_z);
            await controls.update();
        }
        before_canvas = canvas_name;
        await load3dmodelwithidonlocal(this_canvas.slice(-1), this_canvas_modelname);
    });
    
}

function makeChartDataFromModelSets(data) {
    let labels = [],
        eachdata = [];
    let lastdatetime = ["", ""],
        vol,
        mass,
        dens,
        cnt = 0,
        totalvols = 0,
        _id,
        fromtime = new Date(),
        totime = new Date(2000, 1, 1, 0, 0, 0);
    //for last id get
    var last_id,
        last_datetime = totime;
    // console.log(data.log)
    for (const element of data.log) {
        labels.push(element.datetime);
        eachdata.push(element.volume);
        lastdatetime = element.datetime;
        vol = element.volume;
        mass = element.mass;
        cnt = cnt + 1;
        totalvols = totalvols + parseFloat(vol);
        _id = element._id;
        var tmpdate = makedefaultDate(lastdatetime);
        tmpdate = new Date(tmpdate);
        if (fromtime > tmpdate) {
            fromtime = tmpdate;
        }
        if (totime < tmpdate) {
            totime = tmpdate;
            // lastdatetime = element.datetime;
        }
        if (last_datetime < tmpdate) {
            last_datetime = tmpdate;
            last_id = element._id;
        }
    }
    if(data.log.length > 0)
    lastdatetime = data.log[0].datetime.split(" ");
    dens = parseFloat(mass) / parseFloat(vol);
    fromtime.setMinutes(fromtime.getMinutes() - fromtime.getTimezoneOffset());
    totime.setMinutes(totime.getMinutes() - totime.getTimezoneOffset());
    return [
        labels,
        eachdata,
        lastdatetime[0],
        lastdatetime[1],
        (data.log.length > 0)?data.log[0].volume.toFixed(2):0,
        (data.log.length > 0)?data.log[0].mass.toFixed(2):0,
        dens.toFixed(2),
        (totalvols / cnt).toFixed(2),
        _id,
        fromtime.toISOString().slice(0, 19),
        totime.toISOString().slice(0, 19),
        last_id,
    ];
}

function makeChartDataFromModelSetsWithRange(data, ft, tt) {
    let labels = [], eachdata = [];
    var last_id, last_datetime = ft, lastdatetime;
    var cnt = 0, totalvols = 0;
    for (const element of data.log) {
        lastdatetime = element.datetime;
        // var tmpdate = makedefaultDate(lastdatetime);
        var tmpdate = new Date(lastdatetime);

        // console.log(ft.toISOString(),tmpdate.toISOString(),tt.toISOString());
        if (ft <= tmpdate) {
            if (tt >= tmpdate) {
                labels.push(lastdatetime);
                eachdata.push(element.volume);
                cnt = cnt + 1;
                totalvols = totalvols + parseFloat(element.volume);
                //get last date model id
                if (last_datetime < tmpdate) {
                    last_datetime = tmpdate;
                    last_id = element._id;
                }
            }
        }
    }
    $("#lm-averagevolume-" + data.name).html(cnt === 0?0:(totalvols/cnt).toFixed(2));
    return [labels, eachdata, last_id];
}

function makedefaultDate(bugdate) {
    var truedate;
    var tmpstr = bugdate.split(" ");
    var tmpstr1 = tmpstr[0];
    var list = tmpstr1.split(".");
    truedate = list[2] + "-" + list[1] + "-" + list[0] + "T" + tmpstr[1];
    return truedate;
}

//start three js
//three.js point cloud viewer
function main() {
    canvas = document.querySelector("#viewer_3d");

    var mouseDown = false, mouseX = 0, mouseY = 0, timerflag = 0;

    /* touch mode */
    canvas.addEventListener("touchmove", function (e) {
            if (timerflag) onTransfer(e);
            else onTouchMove(e);
        },false);
    canvas.addEventListener("touchstart", function (e) {
            onTouchStart(e);
        }, false);
    canvas.addEventListener("touchend", function (e) {
            onTouchEnd(e);
        }, false);

    /* mouse mode */
    canvas.addEventListener("mousemove", function (e) {
            onMouseMove(e);
        }, false);
    canvas.addEventListener("mousedown", function (e) {
            if (e.button == 0) {
                onMouseDown(e);
            }
        }, false);
    canvas.addEventListener("mouseup", function (e) {
            onMouseUp(e);
        }, false);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    scene = new THREE.Scene();

    var fov = 60;
    var aspect = canvas.clientWidth / canvas.clientHeight; // the canvas default
    var near = 0.01;
    var far = 1000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, -20, 6);
    camera.lookAt(0, 0, 0);
    scene.add(camera);

    //natural rotate control
    controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 0.1;
    controls.maxDistance = 100;
    controls.enableRotate = true;
    controls.maxPolarAngle = Infinity;
    controls.enableRotate = false;
    controls.enableDamping = true;

    group = new THREE.Object3D();
    var points1, pointcloud;
    var loader = new XYZLoader();

    scene.add(group);

    parent_canvas = document.getElementById("viewer_3d").parentNode;
    $("#btn-openfromLocal").click(function () {
        btn_open_model();
    });

    // resize canvas when Toggle fullscreen
    $('a[data-action="expand"]').on("click", async function (e) {
        await new Promise((r) => setTimeout(r, 10));
        onWindowResize();
    });
    window.addEventListener("resize", onWindowResize);

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
    function onTransfer(evt) {
        console.log("long touch");
        var deltaX = evt.touches[0].clientX - mouseX,
            deltaY = evt.touches[0].clientY - mouseY;
        mouseX = evt.touches[0].clientX;
        mouseY = evt.touches[0].clientY;

        // group.position.y -= deltaY * 0.05;//zoom
        group.position.z -= deltaY * 0.05; //zoom
        group.position.x += deltaX * 0.05;
    }

    function onTouchMove(evt) {
        if (!mouseDown) {
            return;
        }
        if (evt.cancelable) {
            evt.preventDefault();
        }
        var deltaX = evt.touches[0].clientX - mouseX,
            deltaY = evt.touches[0].clientY - mouseY;
        mouseX = evt.touches[0].clientX;
        mouseY = evt.touches[0].clientY;
        if (evt.touches.length > 1) {
            camera.fov = 0.5;
            return;
        }
        rotateScene(deltaX, deltaY);
    }

    function onTouchStart(evt) {
        if (evt.cancelable) {
            evt.preventDefault();
        }

        mouseDown = true;
        mouseX = evt.touches[0].clientX;
        mouseY = evt.touches[0].clientY;
    }

    function onTouchEnd(evt) {
        if (evt.cancelable) {
            evt.preventDefault();
        }

        mouseDown = false;
    }

    function rotateScene(deltaX, deltaY) {
        group.rotation.z += deltaX / 100;
        group.rotation.x += deltaY / 100;
    }
}

function onWindowResize() {
    camera.aspect = parent_canvas.clientWidth / parent_canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(
        parent_canvas.clientWidth,
        parent_canvas.clientHeight
    );
}

function render() {
    renderer.render(scene, camera);
}

function animate() {
    requestAnimationFrame(animate);

    controls.update();

    render();
}

async function reloadModelFromJSONData(filename, wholecontent) {
    var vertices = [];
    var colors = [];
    var points2;
    var values = getminmaxheightfromjson(wholecontent);
    var min = values[0];
    var max = values[1];

    wholecontent.forEach(function (xyz) {
        vertices.push(parseFloat(xyz.x)*(-1));
        vertices.push(parseFloat(xyz.y));
        vertices.push(parseFloat(xyz.z));

        let zvalue = parseFloat(xyz.z);
        let k = (zvalue - min) / (max - min);
        let rgb = getrgb(k);
        //set color from xyz
        colors.push(rgb[0]);
        colors.push(rgb[1]);
        colors.push(rgb[2]);
    });

    var geometry1 = new THREE.BufferGeometry();
    geometry1.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3)
    );

    if (colors.length > 0) {
        geometry1.setAttribute(
            "color",
            new THREE.Float32BufferAttribute(colors, 3)
        );
    }

    geometry1.center();

    var vertexColors = geometry1.hasAttribute("color") === true;

    var material = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: vertexColors,
    });

    while (group.children.length > 0) {
        group.remove(group.children[0]);
    }

    points2 = new THREE.Points(geometry1, material);
    group.add(points2);
    render();
}

function getminmaxheightfromjson(lines) {
    var min = Infinity,
        max = -Infinity,
        values = [];
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

//get model xyz cloud data and rerender 3d viewer
function load3dmodelwithidonlocal(modelname, _id) {
    var posturl = "/data/view/" + _id;
    $.post(posturl, { id: _id }, function (data, status) {
        reloadModelFromJSONData(data.name, data.data);
        if(data.name != '')
            $('#input-model-'+modelname).parents('.card').children('.card-header').html('<h4 class="card-title">'+data.name+'</h4>');
        else{
            // let actual_model_name = JSON.parse($('#actual_material_name-' + modelname).children('input').val());
            // if(actual_model_name.material_name)
            //     $('#input-model-'+modelname).parents('.card').children('.card-header').html('<h4 class="card-title">'+modelname + ' - ' + actual_model_name.material_name+'</h4>');
            $('#input-model-'+modelname).parents('.card').children('.card-header').html('<h4 class="card-title">'+modelname + '</h4>');
        }
    });
}

function update_lastidofmodel(modelname, modelid) {
    var modeltag = "input-modelid-" + modelname;
    modeltag = document.getElementById(modeltag).value = modelid;
}

//start chart draw
init_chart();

window.updateGraph = updateGraph;
