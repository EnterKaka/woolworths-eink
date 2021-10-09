import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { XYZLoader, getminmaxhegiht, getrgb, init_highlow } from './XYZLoader.js';

var controls, camera, renderer, scene, canvas, parent_canvas, group;

function init_chart(){
    let names = document.getElementById('input-names').value;
    names = names.split(',');

    for(const name of names){
        let canvasname = 'canvas-model-' + name;
        let inputname = 'input-model-' + name;
        let ctx = document.getElementById(canvasname);
        let data = document.getElementById(inputname).value;
        data = JSON.parse(data);
        // console.log(ctx, data);
        drawChart(ctx, data);
    }
}


function drawChart(ctx,data,ft,tt){
    //draw chart
        // initialize chart option
        var chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
            position: 'bottom',
        },
        hover: {
            mode: 'label'
        },
        scales: {
            xAxes: [{
                display: true,
                gridLines: {
                    color: "#f3f3f3",
                    drawTicks: false,
                },
                scaleLabel: {
                    display: true,
                    labelString: 'Time'
                },
                offset: 60,
                position: 'end',
                labelOffset: {
                    x: 0,
                    y: 15
                  },
            }],
            yAxes: [{
                display: true,
                gridLines: {
                    color: "#f3f3f3",
                    drawTicks: false,
                },
                scaleLabel: {
                    display: true,
                    labelString: 'Volume in m**3'
                }
            }]
        },
        title: {
            display: true,
            text: data.name,
        }
    };
    if(!ft){
        // Chart Data
        var tempdata = makeChartDataFromModelSets(data);
        // console.log(tempdata);
        var chartData = {
            labels: tempdata[0],
            datasets: [{
                label: data.name + " - Volumes",
                data: tempdata[1],
                lineTension: 0,
                fill: false,
                borderColor: "#FF7D4D",
                pointBorderColor: "#FF7D4D",
                pointBackgroundColor: "#FFF",
                pointBorderWidth: 2,
                pointHoverBorderWidth: 2,
                pointRadius: 4,
            }]
        };

        var config = {
            type: 'line',
            // Chart Options
            options : chartOptions,
            data : chartData
        };

        // Create the chart
        var lineChart = new Chart(ctx, config);

        //set necessay extra information
        let lm_date = 'lm-date-' + data.name,
        lm_time = 'lm-time-' + data.name,
        lm_volume = 'lm-volume-' + data.name ,
        lm_mass = 'lm-mass-' + data.name ,
        lm_density = 'lm-density-' + data.name ,
        lm_avervol = 'lm-averagevolume-' + data.name,
        inputmodelid = 'input-modelid-' + data.name,
        inputfromtime = 'fromtime-' + data.name,
        inputtotime = 'totime-'  + data.name,
        btn = 'btn-' + data.name;

        lm_date = document.getElementById(lm_date);
        lm_time = document.getElementById(lm_time);
        lm_volume = document.getElementById(lm_volume);
        lm_mass = document.getElementById(lm_mass);
        lm_density = document.getElementById(lm_density);
        lm_avervol = document.getElementById(lm_avervol);
        inputmodelid = document.getElementById(inputmodelid);
        inputfromtime = document.getElementById(inputfromtime);
        inputtotime = document.getElementById(inputtotime);
        btn = document.getElementById(btn);

        lm_date.innerHTML = tempdata[2];
        lm_time.innerHTML = tempdata[3];
        lm_volume.innerHTML = tempdata[4];
        lm_mass.innerHTML = tempdata[5];
        lm_density.innerHTML = tempdata[6];
        lm_avervol.innerHTML = tempdata[7];
        inputmodelid.value = tempdata[8];
        inputfromtime.value = tempdata[9];
        inputtotime.value = tempdata[10];
        update_lastidofmodel(data.name,tempdata[11]);

        btn.onclick = function () {
            let name = $(this).attr('id');
            name = name.split('-');
            name = name.slice(-1);
            let inputft = 'fromtime-' + name ,inputtt = 'totime-' + name;
            inputft = document.getElementById(inputft).value;
            inputtt = document.getElementById(inputtt).value;
            inputft = new Date(inputft);
            inputtt = new Date(inputtt);

            let canvasname = 'canvas-model-' + name;
            let inputname = 'input-model-' + name;
            let ctx = document.getElementById(canvasname);
            let data = document.getElementById(inputname).value;
            data = JSON.parse(data);
            // console.log(ctx, data);
            drawChart(ctx, data,inputft, inputtt);
        }
        //ondblclick listener
        ctx.addEventListener("dblclick", function() {
            //go to 3d viewer with last id
            var this_canvas = $(this).attr('id');
            this_canvas = this_canvas.split('-');
            var this_canvas_modelname = 'input-modelid-' + this_canvas.slice(-1);
            this_canvas_modelname = document.getElementById(this_canvas_modelname).value
            // location.href = "/data/view/" + this_canvas;
            load3dmodelwithidonlocal(this_canvas.slice(-1),this_canvas_modelname);
        });
    }else{
        // Chart Data
        var tempdata = makeChartDataFromModelSetsWithRange(data,ft,tt);
        // console.log(tempdata);
        var chartData = {
            labels: tempdata[0],
            datasets: [{
                label: data.name + " - Volumes",
                data: tempdata[1],
                lineTension: 0,
                fill: false,
                borderColor: "#FF7D4D",
                pointBorderColor: "#FF7D4D",
                pointBackgroundColor: "#FFF",
                pointBorderWidth: 2,
                pointHoverBorderWidth: 2,
                pointRadius: 4,
            }]
        };

        var config = {
            type: 'line',
            // Chart Options
            options : chartOptions,
            data : chartData
        };

        // Create the chart
        var lineChart = new Chart(ctx, config);

        update_lastidofmodel(data.name, tempdata[2]);
    }
}

function makeChartDataFromModelSets(data){
    let labels = [], eachdata = [];
    let lastdatetime=['',''],vol,mass,dens,cnt = 0,totalvols = 0, _id,
    fromtime = new Date(), totime = new Date(2000,1,1,0,0,0);
    //for last id get
    var last_id, last_datetime = totime;

    for(const element of data.log){
        labels.push(element.datetime);
        eachdata.push(element.volume);
        lastdatetime = element.datetime;
        vol = element.volume;
        mass = element.mass;
        cnt = cnt+1;
        totalvols = totalvols + parseFloat(vol);
        _id = element._id;
        var tmpdate = makedefaultDate(lastdatetime);
        tmpdate = new Date(tmpdate);
        if(fromtime > tmpdate){
            fromtime = tmpdate;
        }
        if(totime < tmpdate){
            totime = tmpdate;
            lastdatetime = element.datetime;
            lastdatetime = lastdatetime.split(' ');
        }
        if(last_datetime < tmpdate){
            last_datetime = tmpdate;
            last_id = element._id;
        }
    }
    dens = parseFloat(mass) / parseFloat(vol);
    fromtime.setMinutes(fromtime.getMinutes() - fromtime.getTimezoneOffset());
    totime.setMinutes(totime.getMinutes() - totime.getTimezoneOffset());
    return [labels, eachdata,lastdatetime[0],lastdatetime[1],vol.toFixed(2),mass.toFixed(2),dens.toFixed(2),
    (totalvols/cnt).toFixed(2),_id, fromtime.toISOString().slice(0,19), totime.toISOString().slice(0,19), last_id];
}

function makeChartDataFromModelSetsWithRange(data,ft,tt){
    let labels = [], eachdata = [];
    var last_id, last_datetime = ft, lastdatetime;
    for(const element of data.log){
        lastdatetime = element.datetime;
        var tmpdate = makedefaultDate(lastdatetime);
        tmpdate = new Date(tmpdate);
        // console.log(ft.toISOString(),tmpdate.toISOString(),tt.toISOString());
        if(ft <= tmpdate){
            if(tt >= tmpdate){
                labels.push(lastdatetime);
                eachdata.push(element.volume);

                //get last date model id
                if(last_datetime < tmpdate){
                    last_datetime = tmpdate;
                    last_id = element._id;
                }
            }
        }
    }
    return [labels, eachdata, last_id];
}

function makedefaultDate(bugdate){
    var truedate;
    var tmpstr = bugdate.split(' ');
    var tmpstr1 = tmpstr[0];
    var list = tmpstr1.split('.');
    truedate = list[2]+'-'+list[1]+'-'+list[0]+'T'+tmpstr[1];

    return truedate;
}

function makedefaultDateString(ruledate){
    var truedate;
    truedate = ruledate.toLocaleDateString().replace('/','-') + 'T' + ruledate.toLocaleTimeString().slice(0,8);
    return truedate;
}

function init_socket(){
    //socket
    var socket = io();
    // socket.emit('broad message', 'Hello Hello hello');
    socket.on('broad message', function(msg) {
        // console.log(msg);
        var dbname = document.getElementById('input-dbname').value;
        var collectionname = document.getElementById('input-collectionname').value;
        var realdata;

        if((msg.data.modelname === dbname) && (msg.data.collectionname === collectionname)){
            realdata = msg.data.datas;
            // console.log('new socket full data ----',realdata);
            var namelist = makenamelist(realdata);
            var originaldata, newdetectlist;
            originaldata = document.getElementById('input-names').value;
            originaldata = originaldata.split(',');
            // console.log('original data ---', originaldata);
            // console.log('new data ---', namelist);
            newdetectlist = detectnewmodelnamelist(originaldata, namelist);
            if(newdetectlist.length > 0){
                // console.log('new detected model -----', newdetectlist);
                var parenttag = document.getElementById('chartjs-line-charts');
                var newhtml = '&nbsp;';
                for(const element of newdetectlist){
                    newhtml = newhtml +  '&nbsp;' +
                    + '<div class="row">' 
                    + '<div class="col-12">'
                    + '<div class="card">'
                    + '<div class="card-header">'
                    + '<h4 class="card-title"></h4>'
                    + '<a class="heading-elements-toggle"><i class="la la-ellipsis-v font-medium-3"></i></a>'
                    + '<div class="heading-elements">'
                    + '<ul class="list-inline mb-0">'
                    + '<li><a data-action="collapse"><i class="ft-minus"></i></a></li>'
                    + '<li><a data-action="reload"><i class="ft-rotate-cw"></i></a></li>'
                    + '<li><a data-action="expand"><i class="ft-maximize"></i></a></li>'
                    + '<li><a data-action="close"><i class="ft-x"></i></a></li>'
                    + '</ul>'
                    + '</div>'
                    + '</div>'
                    + '<div class="card-content collapse show">'
                    + '<div class="card-body chartjs">'
                    + '<div class="height-500">'
                    + '<canvas id="canvas-model-' + element + '"></canvas>'
                    + '</div>'
                    + '<div>'
                    + '<div class="row" style="margin-top: 20px; margin-bottom: 15px; margin-left: -5px;">'
                    + '<div class="col-md-5 col-sm-12 col-12 col-lg-5 col-xl-4">'
                    + 'From&nbsp;<input type="datetime-local" id="fromtime-' + element + '">'
                    + '</div>'
                    + '<div class="col-md-5 col-sm-12 col-12 col-lg-5 col-xl-4">'
                    + 'To&nbsp;<input type="datetime-local" id="totime-' + element + '">'
                    + '</div>'
                    + '<div class="col-md-1 col-sm-1 col-12 col-lg-1 col-xl-1">'
                    + '<button class="btn btn-sm btn-dark" id="btn-' + element + '">Update</button>'
                    + '</div>'
                    + '</div>'
                    + '<!-- model data -->'
                    + '<input type="hidden" id="input-model-' + element + '" value >'
                    + '&Tab;<h4 class="info">Model Information&nbsp;:&nbsp;<%= element.name %></h4><br>'
                    + '<div class="row">'
                    + '<div class="col-md-12 col-lg-6">'
                    + '<dl class="row"><dt class="col-6"> 1 .Last Measurement Date&nbsp;:</dt><dd class="col-6" id="lm-date-' + element + '" ></dd></dl>'
                    + '<dl class="row"><dt class="col-6"> 2 .Last Measurement Time&nbsp;:</dt><dd class="col-6" id="lm-time-' + element + '" ></dd></dl>'
                    + '<dl class="row"><dt class="col-6"> 3 .Last Measurement Volume&nbsp;:</dt><dd class="col-6" id="lm-volume-' + element + '" ></dd></dl>'
                    + '</div>'
                    + '<div class="col-md-12 col-lg-6">'
                    + '<dl class="row"><dt class="col-6"> 4 .Last Measurement Mass&nbsp;:</dt><dd class="col-6" id="lm-mass-' + element + '" ></dd></dl>'
                    + '<dl class="row"><dt class="col-6"> 5 .Last Measurement Density&nbsp;:</dt><dd class="col-6" id="lm-density-' + element + '" ></dd></dl>'
                    + '<dl class="row"><dt class="col-6"> 6 .Average Volume&nbsp;:</dt><dd class="col-6" id="lm-averagevolume-' + element + '" ></dd></dl>'
                    + '</div>'
                    + '</div>'
                    + '<input type="hidden" id="input-modelid-' + element + '">'
                    + '</div>'
                    + '</div>'
                    + '</div>'
                    + '</div>'
                    + '</div>'
                    + '</div>';
                }
                if(newhtml){
                    // console.log(newhtml);
                    // parenttag.innerHTML = newhtml+ parenttag.innerHTML;
                    location.reload();
                    // for(const name of namelist){
                    //     let canvasname = 'canvas-model-' + name;
                    //     let inputname = 'input-model-' + name;
                    //     let ctx = document.getElementById(canvasname);
                    //     let data = document.getElementById(inputname).value;
                    //     if(data){
                    //         data = JSON.parse(data);
                    //     }
                    //     // console.log(ctx, data);
                    //     drawupgradablechart(ctx, name, data, realdata);
                    // }
                }
            }else{
                // console.log('new detected model is not existed');
                for(const name of originaldata){
                    let canvasname = 'canvas-model-' + name;
                    let inputname = 'input-model-' + name;
                    let ctx = document.getElementById(canvasname);
                    let data = document.getElementById(inputname).value;
                    if(data){
                        data = JSON.parse(data);
                    }
                    // console.log(ctx, data);
                    drawupgradablechart(ctx, name, data, realdata);
                }
                
            }
        }
    });
}


//make model name list in specific collection of specific database from data lists
function makenamelist(datas){
    var namelist = [];
    for(const element of datas){
        var modelname = element.measurement[0].name;
        var contains = false;
        for(const elementj of namelist){
            if(elementj === modelname){
                contains = true;
                break;
            }
        }
        if(!contains) namelist.push(modelname);
    }
    return namelist;
}

//detect new model from socket.io data between original data
function detectnewmodelnamelist(originallist,newlist){
    var detectlist = [];
    for(const element of newlist){
        var contains = false;
        for(const elementj of originallist){
            if(elementj == element){
                contains = true;
                break;
            }
        }
        if(!contains){
            detectlist.push(element);
        }
    }
    return detectlist;
}

//make new model list from new data stream
function drawupgradablechart(ctx, modelname, originaldata, newdata){
    // console.log(ctx, modelname, originaldata, newdata);
    var upgradabledatalist = [];
    for(const element of newdata){
        if(modelname === element.measurement[0].name){
            var new_id, contains = false;
            new_id = element._id;
            if(originaldata){
                for(const elementj of originaldata.log){
                    var old_id;
                    old_id = elementj._id;
                    if(old_id === new_id){
                        contains = true;
                        break;
                    }
                }
                if(!contains){
                    upgradabledatalist.push(element);
                }
            }else{
                upgradabledatalist.push(element);
            }
            
        }
    } 
    if(upgradabledatalist.length > 0){
        // console.log('upgrade ready---');
        var temp_originaldata;
        upgradabledatalist = makeusefuldatafromnative(upgradabledatalist);
        if(originaldata){
            temp_originaldata = originaldata;
            temp_originaldata.log = temp_originaldata.log.concat(upgradabledatalist);
        }else{
            temp_originaldata = {
                name: modelname,
                log: upgradabledatalist,
            }
        }
        // console.log(temp_originaldata);
        drawChart(ctx,temp_originaldata);
        //write new data to input tag
        var inputtag = 'input-model-' + modelname;
        document.getElementById(inputtag).value = JSON.stringify(temp_originaldata);
    }else{
        // console.log('no upgradable list---');
    }
}

function makeusefuldatafromnative(nativedata){
    var usefuldata = [];
    for(const element of nativedata){
        var jsondata = {
            _id: element._id,
            datetime: element.datetime,
            mass: element.measurement[0].mass,
            volume: element.measurement[0].volume
        }
        usefuldata.push(jsondata);
    }
    return usefuldata;
}




//start three js
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
    controls.minDistance = 0.1;
    controls.maxDistance = 100;
    controls.enableRotate = true;
    controls.maxPolarAngle = Infinity;
    controls.enableRotate = false;
    controls.enableDamping = true;
    
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
}

function render(){
    renderer.render( scene, camera);
}

function animate(){
    requestAnimationFrame( animate );

    controls.update();

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
   
    points2 = new THREE.Points( geometry1, material );
    group.add( points2 );
    // scene.add( points2 );
    render();
}

async function reloadModelFromJSONData(filename,wholecontent) {
    if(filename){
        document.getElementById('modelpath').innerHTML = filename;
    }
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
    
    points2 = new THREE.Points( geometry1, material );
    group.add( points2 );
    render();
}

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

//get model xyz cloud data and rerender 3d viewer
function load3dmodelwithidonlocal(modelname,_id){
    var posturl = '/data/view/' + _id;
    $.post(posturl, { id: _id }, function(data, status){
        reloadModelFromJSONData(modelname,data.data);
    });
}

function update_lastidofmodel(modelname,modelid){
    var modeltag = 'input-modelid-'+modelname;
    modeltag = document.getElementById(modeltag).value = modelid;
}

//draw three.js
init_highlow();

main();

animate();

//start chart draw
init_chart();

//init socket
init_socket();

