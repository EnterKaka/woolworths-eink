var express = require("express");
var app = express();
const MongoClient = require("mongodb").MongoClient;
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const Schedule = require("../model/Schedule");
const Value = require("../model/Value");
const Setting = require("../model/Setting");
const Joi = require("joi");
const { spawn } = require("child_process");
const WebSocket = require("ws");

// const { networkInterfaces } = require("os");
const ip = require("ip");
var children = [];
app.get("/", auth, async function (req, res) {
    // render to views/index.ejs template file
    console.log("******** load oes_control ************");
    // const nets = networkInterfaces();
    sch_obj = await get_week_schedule();
    let path = await Value.findOne({ name: "path" });
    if (!path) path = "";
    else path = path.value;

    let server_ip = ip.address();
    // for (const name of Object.keys(nets)) {
    //     for (const net of nets[name]) {
    //         // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
    //         if (net.family === "IPv4" && !net.internal) {
    //             if (name == "Ethernet" || name == "") server_ip = net.address;
    //         }
    //     }
    // }
    res.render("pages/oes_control", {
        title: "3D Viewer - Owl Studio Web App",
        priv: req.user.privilege,
        server_ip: server_ip,
        schedule_data: sch_obj,
        path: path,
    });
});
/***** run app ***/
app.post("/runApp", async function (req, res, next) {
    console.log("***************** run app ******************");
    let path = req.body.path;
    try {
        var child = spawn(path);
        var flag = 1;
        await child.on("error", async function (err) {
            console.log("Error occurred: " + err);
            flag = 0;
            await res.send("failed");
        });
        if (flag) {
            children.push(child);
            res.send("success");
        }
    } catch (error) {
        res.send("failed");
    }
});
/***** kill app ***/
app.post("/killApp", async function (req, res, next) {
    console.log("***************** kill app ******************");
    console.log(children.length);
    if (children.length === 0) res.send("failed");
    else {
        var child = children.pop();
        child.kill();
        // child.stdout.on("data", function (data) {
        //     console.log("stdout:" + data);
        // });

        // child.stderr.on("data", function (data) {
        //     console.log("stderr:" + data);
        // });

        // child.stdin.on("data", function (data) {
        //     console.log("stdin:" + data);
        // });
        res.send("success");
    }
});
/********** save schedule *********/
app.post("/save_sch", async function (req, res, next) {
    var start_arr = req.body.start_time.split(":");
    let sch = {
        day: req.body.day,
        interval_value: req.body.interval_value,
        unit: req.body.unit,
        start_time: req.body.start_time,
        end_time: req.body.end_time,
    };
    try {
        await Schedule.deleteOne({ day: req.body.day });
        let v_sch = new Schedule(sch);
        await v_sch.save();
        week_schedule = await get_week_schedule();
        res.send("success");
    } catch (error) {
        res.send("failed");
    }
});
/***************** auto interval search and load ******************/
var auto_Schedule = async function () {
    var last_week_day = "";
    week_schedule = await get_week_schedule();
    let path = await Value.findOne({ name: "path" });
    if (!path) path = "";
    else path = path.value;
    var daytimer;
    let server_ip = ip.address();
    var daytimer_interval = async () => {
        var child = await spawn(path);
        await child.on("error", async function (err) {
            console.log("not open");
            return;
        });
        var websocket = await new WebSocket("ws://" + server_ip + ":1234");
        websocket.on("open", async function () {
            console.log("open");
            await websocket.send("start scan");
            await LoadDataFunction();
            console.log("scan load");
            websocket.close();
            child.kill();
        });
    };
    var start_flag = 0;
    totaltimer = setInterval(() => {
        console.log("here");

        let current_day = new Date();
        const weekday = new Array(7);
        weekday[0] = "Sunday";
        weekday[1] = "Monday";
        weekday[2] = "Tuesday";
        weekday[3] = "Wednesday";
        weekday[4] = "Thursday";
        weekday[5] = "Friday";
        weekday[6] = "Saturday";
        let week_day = weekday[current_day.getDay()];
        if (last_week_day === week_day) {
            var obj = week_schedule.find((e) => e.day === week_day);
            var arr = obj.start_time.split(":");
            var arr_end = obj.end_time.split(":");
            var today = new Date();
            var today_end = new Date();
            today_end.setHours(arr_end[0], arr_end[1], 0, 0);
            today.setHours(arr[0], arr[1], 0, 0);
            //start timer when start time.
            if (
                !daytimer &&
                current_day.getTime() >= today.getTime() &&
                current_day.getTime() <= today_end.getTime()
            ) {
                start_flag = 1;
                var int_time =
                    obj.interval_value *
                    (obj.unit === "min" ? 60 : 3600) *
                    1000;
                console.log("start timer");
                daytimer_interval();
                delaytime = int_time;
                daytimer = setInterval(daytimer_interval, int_time);
            }
            //kill timer when end time.
            if (current_day.getTime() >= today_end.getTime()) {
                console.log("kill timer");
                clearInterval(daytimer);
                delaytime = 24 * 3600 * 1000;
            }
        } else {
            //when date change reset daytimer
            start_flag = 0;
            console.log("change");
            console.log("kill timer");
            last_week_day = week_day;
            clearInterval(daytimer);
            delaytime = 24 * 3600 * 1000;
        }
    }, 1000 * 60);
};

async function get_week_schedule() {
    let days = [
        { day: "Monday" },
        { day: "Tuesday" },
        { day: "Wednesday" },
        { day: "Thursday" },
        { day: "Friday" },
        { day: "Saturday" },
        { day: "Sunday" },
    ];
    let allmembers = await Schedule.find();
    let sch_obj = [];
    days.forEach((obj) => {
        var element = allmembers.find((e) => e.day === obj.day);
        if (element) {
            sch_obj.push({
                day: element.day,
                interval_value: element.interval_value,
                unit: element.unit,
                start_time: element.start_time,
                end_time: element.end_time,
            });
        } else
            sch_obj.push({
                day: obj.day,
                interval_value: "",
                unit: "",
                start_time: "",
                end_time: "",
            });
    });
    return sch_obj;
}
async function LoadDataFunction() {
    try {
        const client = new MongoClient("mongodb://localhost:27017/", {
            useUnifiedTopology: true,
            useNewUrlParser: true,
            connectTimeoutMS: 30000,
            keepAlive: 1,
        });
        let allmembers = await Setting.find();
        await client.connect();
        let sentdata = [];
        /* connect all collections */
        for (let mem of allmembers) {
            /* get cursor */
            let db = mem.dbname.trim();
            let col = mem.collectionname.trim();
            const database = client.db(db);
            const datas = database.collection(col);
            // const cursor = datas.find({}).sort([['datetime', -1]]);
            const cursor = datas.aggregate([{ $sort: { datetime: -1 } }], {
                allowDiskUse: true,
            });

            await cursor.forEach(function (model) {
                let splitdata = model.datetime.split(" ");
                let eachmodeldata = {
                    _id: model._id,
                    date: splitdata[0],
                    time: splitdata[1],
                    name: model.measurement[0].name,
                    mass: model.measurement[0].mass,
                    volume: model.measurement[0].volume,
                    setid: mem._id.toString(),
                };
                sentdata.push(eachmodeldata);
            });
        }
        loadedData = sentdata;
        console.log("load ended");
    } catch (error) {
        throw error;
        console.log("load failed");
    }
}

/**
 * We assign app object to module.exports
 *
 * module.exports exposes the app object as a module
 *
 * module.exports should be used to return the object
 * when this file is required in another module like app.js
 */
module.exports = { app, auto_Schedule };
