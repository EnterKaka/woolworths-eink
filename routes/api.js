var express = require("express");
var app = express();
const MongoClient = require("mongodb").MongoClient;
var ObjectId = require("mongoose").Types.ObjectId;
const Setting = require("../model/Setting");

/* custom sort function */

var mysortfunction = (a, b) => {
    var o1 = a["date"].toLowerCase();
    var o2 = b["date"].toLowerCase();

    var p1 = a["time"].toLowerCase();
    var p2 = b["time"].toLowerCase();

    if (o1 < o2) return -1;
    if (o1 > o2) return 1;
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
    return 0;
};

/* load all data form db */
async function loadAllData() {
    const client = new MongoClient("mongodb://localhost:27017/", {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        connectTimeoutMS: 30000,
        keepAlive: 1,
    });
    /* get all collections */
    let allmembers = await Setting.find();
    /* DB connect */
    await client.connect();
    let sentdata = [];
    /* connect all collections */
    for (let mem of allmembers) {
        /* get cursor */
        let db = mem.dbname.trim();
        let col = mem.collectionname.trim();
        if (db === "delaytime") {
            continue;
        }
        const database = client.db(db);
        const datas = database.collection(col);
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
}

/*
 * API - all models (timeinterval or latest)
 * @param-from: to: latest: name:
 */
app.post("/allmodels/timeinterval", async function (req, res, next) {
    console.log("*********** API **** allmodel ****** timeinterval  ********");

    let fromTime = req.body.from;
    if (typeof fromTime === "undefined") fromTime = "1900.01.01 00:00:00";
    fromTime = new Date(fromTime);

    let toTime = req.body.to;
    if (typeof toTime === "undefined") toTime = new Date();
    else toTime = new Date(toTime);
    if (fromTime > toTime) {
        res.header(400).json({
            status: "failed",
            reason: "No document found.",
        });
    }
    /* model name */
    let name = req.body.name;
    if (typeof name === "undefined") name = "all";
    else name = name.toLowerCase();

    async function run() {
        try {
            /* if loadedData is empty, get data from db */
            if (loadedData === "") {
                await loadAllData();
                if (loadedData.length === 0) {
                    console.log("No documents found!");
                    res.header(400).json({
                        status: "failed",
                        reason: "No document found.",
                    });
                }
            }
            let sendData = [];
            /* sort loaded_data asc */
            loadedData.sort(mysortfunction);
            /* find data in time interval */
            loadedData.find((o) => {
                var date = o.date.split(".");
                var timestamp = new Date(
                    date[2] + "." + date[1] + "." + date[0] + " " + o.time
                );
                if (fromTime <= timestamp && timestamp <= toTime) {
                    if (name !== "all") {
                        if (o.name === req.body.name) sendData.push(o);
                    } else {
                        sendData.push(o);
                    }
                }
            });
            /* If set latest value is true get latest value of each model */
            if (req.body.latest * 1 == 1) {
                var divided_arr = sendData.reduce(function (obj, value) {
                    var key = value.name;
                    if (obj[key] == null) obj[key] = [];
                    obj[key].push(value);
                    return obj;
                }, {});
                sendData = [];
                for (var key in divided_arr) {
                    sendData.push(divided_arr[key].pop());
                }
            }
            res.header(200).json({
                status: "success",
                data: sendData,
            });
        } finally {
            await client.close();
        }
    }
    run().catch((err) => {
        // console.log("mongodb connect error ========");
        // res.header(400).json({status: 'failed', reason:'MongoDB connection Failed.'});
    });
});

/*
 * API - all models (the last measurements as a certain number)
 * @param-number:
 */
app.post("/allmodels/number", async function (req, res, next) {
    console.log("*********** API **** allmodel ****** number  ********");
    let number = req.body.number;
    if (number * 1 == 0 || typeof number === "undefined") {
        res.header(400).json({
            status: "failed",
            reason: "No document found.",
        });
    }

    /* model name */
    let name = req.body.name;
    if (typeof name === "undefined") name = "all";
    else name = name.toLowerCase();

    async function run() {
        try {
            /* if loadedData is empty, get data from db */
            if (loadedData === "") {
                await loadAllData();
                if (loadedData.length === 0) {
                    console.log("No documents found!");
                    res.header(400).json({
                        status: "failed",
                        reason: "No document found.",
                    });
                }
            }
            let sendData = [];
            /* sort loaded_data asc */
            loadedData.sort(mysortfunction);
            /* find model name */
            if (name !== "all")
                loadedData.find((o) => {
                    if (o.name === req.body.name) sendData.push(o);
                });
            else sendData = loadedData;
            /* get latest number of values from all data */
            sendData = sendData.slice(-1 * number);
            res.header(200).json({
                status: "success",
                data: sendData,
            });
        } finally {
            await client.close();
        }
    }
    run().catch((err) => {
        // console.log("mongodb connect error ========");
        // res.header(400).json({status: 'failed', reason:'MongoDB connection Failed.'});
    });
});

module.exports = app;
