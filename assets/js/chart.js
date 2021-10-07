let names = document.getElementById('input-names').value;
names = names.split(',');

for(const name of names){
    let canvasname = 'canvas-model-' + name;
    let inputname = 'input-model-' + name;
    let ctx = document.getElementById(canvasname);
    let data = document.getElementById(inputname).value;
    data = JSON.parse(data);
    console.log(ctx, data);
    drawChart(ctx, data);
}

function drawChart(ctx,data){
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
                    labelString: 'Measurement Date Time'
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
                    labelString: 'Volume'
                }
            }]
        },
        title: {
            display: true,
            text: data.name + ' - Line Chart',
        }
    };

    // Chart Data
    var tempdata = makeChartDataFromModelSets(data);
    console.log(tempdata);
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
    let lm_datetime = 'lm-datetime-' + data.name,
    lm_volume = 'lm-volume-' + data.name ,
    lm_mass = 'lm-mass-' + data.name ,
    lm_density = 'lm-density-' + data.name ,
    lm_avervol = 'lm-averagevolume-' + data.name,
    inputmodelid = 'input-modelid-' + data.name;

    lm_datetime = document.getElementById(lm_datetime);
    lm_volume = document.getElementById(lm_volume);
    lm_mass = document.getElementById(lm_mass);
    lm_density = document.getElementById(lm_density);
    lm_avervol = document.getElementById(lm_avervol);
    inputmodelid = document.getElementById(inputmodelid);

    lm_datetime.innerHTML = tempdata[2];
    lm_volume.innerHTML = tempdata[3];
    lm_mass.innerHTML = tempdata[4];
    lm_density.innerHTML = tempdata[5];
    lm_avervol.innerHTML = tempdata[6];
    inputmodelid.value = tempdata[7];
    //ondblclick listener
    ctx.addEventListener("dblclick", function() {
        //go to 3d viewer with last id
        var this_canvas = $(this).attr('id');
        this_canvas = this_canvas.split('-');
        this_canvas = 'input-modelid-' + this_canvas.slice(-1);
        this_canvas = document.getElementById(this_canvas).value
        location.href = "/data/view/" + this_canvas;
    });
}

function makeChartDataFromModelSets(data){
    let labels = [], eachdata = [];
    let lastdatetime='1.1.1990 0:0:0',vol,mass,dens,cnt = 0,totalvols = 0, _id,
    fromtime = Date.now(), totime = new Date(2000,1,1,0,0,0);
    for(const element of data.log){
        labels.push(element.datetime);
        eachdata.push(element.volume);
        lastdatetime = element.datetime;
        vol = element.volume;
        mass = element.mass;
        cnt = cnt+1;
        totalvols = totalvols + parseFloat(vol);
        _id = element._id;
    }
    dens = parseFloat(mass) / parseFloat(vol);
    return [labels, eachdata,lastdatetime,vol,mass,dens,totalvols/cnt,_id];
}