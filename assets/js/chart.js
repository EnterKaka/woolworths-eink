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
            text: data.name,
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
    let lm_date = 'lm-date-' + data.name,
    lm_time = 'lm-time-' + data.name,
    lm_volume = 'lm-volume-' + data.name ,
    lm_mass = 'lm-mass-' + data.name ,
    lm_density = 'lm-density-' + data.name ,
    lm_avervol = 'lm-averagevolume-' + data.name,
    inputmodelid = 'input-modelid-' + data.name,
    inputfromtime = 'fromtime-' + data.name,
    inputtotime = 'totime-'  + data.name;

    lm_date = document.getElementById(lm_date);
    lm_time = document.getElementById(lm_time);
    lm_volume = document.getElementById(lm_volume);
    lm_mass = document.getElementById(lm_mass);
    lm_density = document.getElementById(lm_density);
    lm_avervol = document.getElementById(lm_avervol);
    inputmodelid = document.getElementById(inputmodelid);
    inputfromtime = document.getElementById(inputfromtime);
    inputtotime = document.getElementById(inputtotime);

    lm_date.innerHTML = tempdata[2];
    lm_time.innerHTML = tempdata[3];
    lm_volume.innerHTML = tempdata[4];
    lm_mass.innerHTML = tempdata[5];
    lm_density.innerHTML = tempdata[6];
    lm_avervol.innerHTML = tempdata[7];
    inputmodelid.value = tempdata[8];
    inputfromtime.value = tempdata[9];
    inputtotime.value = tempdata[10];

    // alert(tempdata[9] + '--------' + tempdata[10]);
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
    let lastdatetime=['',''],vol,mass,dens,cnt = 0,totalvols = 0, _id,
    fromtime = new Date(), totime = new Date(2000,1,1,0,0,0);
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
    }
    dens = parseFloat(mass) / parseFloat(vol);
    return [labels, eachdata,lastdatetime[0],lastdatetime[1],vol,mass,dens,totalvols/cnt,_id, fromtime.toISOString().slice(0,19), totime.toISOString().slice(0,19)];
}

function makedefaultDate(bugdate){
    var truedate;
    var tmpstr = bugdate.split(' ');
    var tmpstr1 = tmpstr[0];
    var list = tmpstr1.split('.');
    truedate = list[2]+'-'+list[1]+'-'+list[0]+'T'+tmpstr[1];

    return truedate;
}