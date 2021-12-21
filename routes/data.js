var express = require("express");
var app = express();
const MongoClient = require("mongodb").MongoClient;
var ObjectId = require("mongoose").Types.ObjectId;
const auth = require("../middleware/auth");
const Setting = require("../model/Setting");
const Schedule = require("../model/Schedule");
const ip = require("ip");
const fs = require("fs");
const logger = fs.createWriteStream("user-log/oe_server_logfile.txt", {
    flags: "a", // 'a' means appending (old data will be preserved)
});
async function writeLog(msg) {
    logger.write(msg + "\r\n");
    console.log(msg);
}

var interval;

/* load data page */
app.get("/", auth, async function (req, res, next) {
    console.log("*********** load data page ************");
    let server_ip = await ip.address();
    console.log(server_ip);
    async function run() {
        try {
            res.render("pages/data", {
                title: "Model DB - Owl Studio Web App",
                loadedData: loadedData,
                server_ip: server_ip,
                data: loadedData === "" ? [] : loadedData,
            });
        } finally {
        }
    }
    run().catch((err) => {
        console.log("mongodb connect error ========");
        console.error(err);
        //  process.exit(1)
        req.flash("error", err);
        // redirect to users list page
        res.render("pages/data", {
            title: "Model DB - Owl Studio Web App",
            server_ip: server_ip,
            // data: sentdata,
            loadedData: loadedData,
            data: [],
        });
    });
});

/* click view button in data page*/

app.get("/view/(:_id)", auth, async function (req, res, next) {
    console.log("*********** data ******* view(click in data page) ***");

    const client = new MongoClient("mongodb://localhost:27017/", {
        useUnifiedTopology: true,
    });

    async function run() {
        try {
            /* find object in loaded data*/
            var id = req.params._id;
            let obj = loadedData.find((o) => {
                if (o._id.toString() === id) return true;
            });

            /* find setting data by setting id*/
            let setobj = await Setting.findOne({
                _id: new ObjectId(obj.setid),
            });

            /* get pointcloud from collection */
            let dbname = setobj.dbname;
            let collectionname = setobj.collectionname;
            await client.connect();
            const database = client.db(dbname);
            const datas = database.collection(collectionname);
            const cursor = await datas.findOne({ _id: new ObjectId(id) });

            if (cursor) {
                console.log("success get data");
                req.flash(
                    "success",
                    "Data loaded successfully! DB = " + dbname
                );
                var pcl = cursor.measurement[0].pointcloud;
                console.log("point cloud ========================");
                req.flash("pointcloud", JSON.stringify(pcl));
                req.flash("pcl_name", cursor.measurement[0].name);
                res.redirect("/viewer");
            } else {
                console.log("No documents found!");
                req.flash("error", "No existed");
                // redirect to users list page
                res.redirect("/data/");
            }
        } finally {
        }
    }
    run().catch((err) => {
        console.log("mongodb connect error ========");
        console.error(err);
        //  process.exit(1)
        req.flash("error", err);
        // redirect to users list page
        res.redirect("/data/");
    });
});

app.post("/view/(:id)", auth, async function (req, res, next) {
    const client = new MongoClient("mongodb://localhost:27017/", {
        useUnifiedTopology: true,
    });

    console.log("*********** data ******* view(click graph) ***");

    async function run() {
        try {
            var id = req.params.id;
            let obj = loadedData.find((o) => {
                if (o._id.toString() === id) return true;
            });
            let setobj = await Setting.findOne({
                _id: new ObjectId(obj.setid),
            });
            let dbname = setobj.dbname;
            let collectionname = setobj.collectionname;
            await client.connect();
            const database = client.db(dbname);
            const datas = database.collection(collectionname);
            // query for movies that have a runtime less than 15 minutes
            const cursor = await datas.findOne({ _id: new ObjectId(id) });
            // console.log(cursor);
            // print a message if no documents were found

            if (cursor) {
                var format = (
                    Math.round(cursor.measurement[0].volume * 100) / 100
                ).toFixed(2);
                // req.flash('pcl_name', cursor.measurement[0].name + ' : ' + cursor.measurement[0].date + ' ' + cursor.measurement[0].time + ' (' + format + ')');
                // replace console.dir with your callback to access individual elements
                var pcl = cursor.measurement[0].pointcloud;
                var display_name = "";
                if (cursor.measurement[0].material_name && cursor.measurement[0].material_name != '')
                    display_name = cursor.measurement[0].name + " - " + cursor.measurement[0].material_name;
                else
                    display_name = '';
                res.header(200).json({
                    status: "sucess",
                    data: pcl,
                    name: display_name,
                });
            } else {
                res.header(400).json({
                    status: "fail",
                    data: "no model",
                });
            }
        } finally {
        }
    }
    run().catch((err) => {
        res.header(400).json({
            status: "fail",
            error: err,
        });
    });
});

app.get("/edit/(:_id)", auth, async function (req, res, next) {
    // let model = await Model.findOne({datetime: req.params.datetime})
    const client = new MongoClient("mongodb://localhost:27017/", {
        useUnifiedTopology: true,
    });

    async function run() {
        try {
            /* find object in loaded data*/
            var id = req.params._id;
            let obj = loadedData.find((o) => {
                if (o._id.toString() === id) return true;
            });

            /* find setting data by setting id*/
            let setobj = await Setting.findOne({
                _id: new ObjectId(obj.setid),
            });

            /* get pointcloud from collection */
            let dbname = setobj.dbname;
            let collectionname = setobj.collectionname;

            await client.connect();
            const database = client.db(dbname);
            const datas = database.collection(collectionname);
            // query for movies that have a runtime less than 15 minutes
            const cursor = await datas.findOne({
                _id: new ObjectId(req.params._id),
            });
            // console.log(cursor);
            // print a message if no documents were found
            if (cursor) {
                // replace console.dir with your callback to access individual elements
                console.log("success get data");
                req.flash(
                    "success",
                    "Data loaded successfully! DB = " + dbname
                );
                // redirect to users list page
                var pcl = cursor.measurement[0].pointcloud;
                console.log("point cloud ========================");
                req.flash("pointcloud", JSON.stringify(pcl));
                req.flash("pcl_name", cursor.measurement[0].name);
                res.redirect("/editer");
            } else {
                console.log("No documents found!");
                req.flash("error", "No existed");
                // redirect to users list page
                res.redirect("/data/");
            }
        } finally {
            await client.close();
        }
    }
    run().catch((err) => {
        console.log("mongodb connect error ========");
        console.error(err);
        //  process.exit(1)
        req.flash("error", err);
        // redirect to users list page
        res.redirect("/data/");
    });
});
/* Delete select data */

app.post('/delete', async function (req, res) {
    console.log("*********** delete ******* single data ***");
    
    const client = new MongoClient("mongodb://localhost:27017/", {
        useUnifiedTopology: true,
    });

    async function run() {
        try {
            /* find object in loaded data*/
            var id = req.body._id;
            let obj = loadedData.find((o) => {
                if (o._id.toString() === id) return true;
            });
            /* find setting data by setting id*/
            let setobj = await Setting.findOne({
                _id: new ObjectId(obj.setid),
            });

            /* get pointcloud from collection */
            let dbname = setobj.dbname;
            let collectionname = setobj.collectionname;
            await client.connect();
            const database = client.db(dbname);
            const datas = database.collection(collectionname);
            const cursor = await datas.deleteOne({ _id: new ObjectId(id) });
            var index = loadedData.findIndex((o) => {
                if (o._id.toString() === id) return true;
            });
            loadedData.splice(index,1);
            if (cursor) {
                var str = 'DB: ' + dbname + 'Collection: ' + collectionname + 'model: ' + obj.name + 'Time: ' + obj.date +' '+ obj.time + ' User: ' + req.session.user_info.email + 'Time:' + (new Date());
                writeLog('Delete Data ('+str+')');    
                res.send("success");
            } else {
                res.send("failed");
            }
        } finally {
        }
    }
    run().catch((err) => {
        res.send("failed");
    });
});
/* Delete model */

app.post('/delete_model', async function (req, res) {
    console.log("*********** delete ******* model data ***");
    
    const client = new MongoClient("mongodb://localhost:27017/", {
        useUnifiedTopology: true,
    });
    var model_name = req.body.model_name;

    async function run() {
        try {
            /* find object in loaded data*/
            var elements = [];
            loadedData.find((o) => {
                if (o.name != model_name)  
                elements.push(o);
            });
            loadedData = elements;

            /* find setting data by setting id*/
            let setobj = await Setting.find();
            var flag = false;
            await client.connect();
            for (let ele of setobj) {
                let dbname = ele.dbname;
                let collectionname = ele.collectionname;
                let database = client.db(dbname);
                let datas = database.collection(collectionname);
                cursor = await datas.deleteMany({"measurement.name":{$in:[model_name]}});
                if(cursor) flag = true;
            };

            if (flag) {
                var str = 'model: ' + model_name + 'User: ' + req.session.user_info.email + 'Time:' + (new Date());
                writeLog('Delete model ('+str+')');    
                res.send("success");
            } else {
                res.send("failed");
            }
        } finally {
        }
    }
    run().catch((err) => {
        res.redirect("failed");
    });
});

app.post("/getmodellist", async function (req, res, next) {
    console.log("getmodellist");
    const client = new MongoClient("mongodb://localhost:27017/", {
        useUnifiedTopology: true,
    });
    const dbname = req.body.db;
    const colname = req.body.col;
    console.log(req.body, dbname, colname);
    async function run() {
        try {
            await client.connect();
            const database = client.db(dbname);
            const collection = database.collection(colname);
            var testdata = await collection.findOne({});
            if (
                !testdata.name ||
                !testdata.date ||
                !testdata.time ||
                !testdata.data ||
                !testdata.type
            ) {
                res.header(200).json({
                    error: "This collection doesn't seem to be for model data.",
                });
            } else {
                var data = await collection.find({}).toArray();
                res.header(200).json({
                    success: true,
                    data: data,
                });
            }
            // print a message if no documents were found
        } finally {
            await client.close();
        }
    }
    run().catch((err) => {
        console.log("mongodb connect error ========");
        console.error(err);
        //  process.exit(1)
        req.flash("error", err);
        res.header(200).json({
            error: "db error",
        });
    });
});

app.post("/getdatabaselist", async function (req, res, next) {
    const client = new MongoClient("mongodb://localhost:27017/", {
        useUnifiedTopology: true,
    });
    async function run() {
        try {
            await client.connect();
            const database = client.db("OwlEyeStudioWebInterface");
            const adminDb = await database.admin();
            const datalist = await adminDb.listDatabases();
            const basenames = datalist.databases;
            var dblist = [];
            for (var i = 0; i < basenames.length; i++) {
                const base = client.db(basenames[i].name);
                const cols = await base.collections();
                var dbcell = {};
                dbcell.db = basenames[i].name;
                dbcell.col = [];
                for (var j = 0; j < cols.length; j++) {
                    dbcell.col.push(cols[j].collectionName);
                }
                dblist.push(dbcell);
            }
            res.header(200).json({
                success: true,
                data: dblist,
            });
            // print a message if no documents were found
        } finally {
            await client.close();
        }
    }
    run().catch((err) => {
        console.log("mongodb connect error ========");
        console.error(err);
        //  process.exit(1)
        req.flash("error", err);
        res.header(200).json({
            error: "db error",
        });
    });
});

app.post("/multimodelsave", async function (req, res, next) {
    console.log("multimodelsave called");
    const client = new MongoClient("mongodb://localhost:27017/", {
        useUnifiedTopology: true,
    });
    var modeldata = req.body.savedata;
    var databaseName = req.body.database;
    var collectionName = req.body.collection;
    console.log(databaseName, collectionName);
    async function run() {
        try {
            await client.connect();
            const database = client.db(databaseName);
            const collection = database.collection(collectionName);
            // query for movies that have a runtime less than 15 minutes
            console.log("saving ...");
            await collection.insertMany(modeldata);
            console.log("saved");
            res.header(200).json({
                success: true,
            });
            // print a message if no documents were found
        } finally {
            await client.close();
        }
    }
    run().catch((err) => {
        console.log("mongodb connect error ========");
        console.error(err);
        //  process.exit(1)
        req.flash("error", err);
        res.header(200).json({
            error: "db error",
        });
    });
});
app.post("/modelsave", async function (req, res, next) {
    console.log("modelsave called.");
    const client = new MongoClient("mongodb://localhost:27017/", {
        useUnifiedTopology: true,
    });
    var modeldata = req.body.modeldata;
    var db = req.body.db;
    var col = req.body.col;
    console.log(db, col);
    async function run() {
        try {
            await client.connect();
            const database = client.db(db);
            const collection = database.collection(col);
            // query for movies that have a runtime less than 15 minutes
            await collection.insertOne(modeldata);
            res.header(200).json({
                success: true,
            });
            // print a message if no documents were found
        } finally {
            await client.close();
        }
    }
    run().catch((err) => {
        console.log("mongodb connect error ========");
        console.error(err);
        //  process.exit(1)
        req.flash("error", err);
        res.header(200).json({
            error: "db error",
        });
    });
});
app.post("/getmodels", async function (req, res, next) {

    const client = new MongoClient("mongodb://localhost:27017/", {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        connectTimeoutMS: 30000,
        keepAlive: 1,
    });
    let allmembers = await Setting.find();

    var ids = req.body.data;
    var from = req.body.from;
    var to = req.body.to;
    let query = [];
    for (let id of ids) {
        query.push({ _id: new ObjectId(id) })
    }
    async function run() {
        try {
            await client.connect();
            let sentdata = [];
            console.log(ids)
            console.log(allmembers)

            for (let mem of allmembers) {
                /* get cursor */
                let db = mem.dbname.trim();
                let col = mem.collectionname.trim();
                const database = client.db(db);
                const datas = database.collection(col);
                // const cursor = await datas.find( { $or: ids } ).sort({datetime:-1})
                // const cursor = datas.aggregate([{ $match: { $or:ids } },{ $sort: { datetime: -1 } }], {
                //     allowDiskUse: true,
                // });
                const cursor = await datas.find({ $or: query }).sort({ datetime: 1 })
                // const cursor = await datas.find({_id:new ObjectId('61a0cd0c89780000bb0070fa')})
                // console.log(cursor.length)
                await cursor.forEach(function (model) {
                    if (model.measurement[0].date >= from && model.measurement[0].date <= to)
                        sentdata.push(model.measurement[0].pointcloud);
                });

            }
            // console.log({data:sentdata[0]})
            // if (sentdata.length === 0) {
            //     res.header(400).json({ status: false });
            // } else {
            res.header(200).json({
                status: true,
                data: sentdata,
            });
            // }

        } finally {
            await client.close();
        }
    }
    run().catch((err) => {
        console.log("mongodb connect error ========");
        console.error(err);
        //  process.exit(1)
        req.flash("error", err);
        res.header(200).json({
            error: "db error",
        });
    });
});

/* click get data button in data page */

app.post("/get", auth, async function (req, res, next) {
    console.log("*********** data **** get data ********");

    /* get all collections */
    const client = new MongoClient("mongodb://localhost:27017/", {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        connectTimeoutMS: 30000,
        keepAlive: 1,
    });
    let allmembers = await Setting.find();

    async function run() {
        try {
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
            // print a message if no documents were found
            if (sentdata.length === 0) {
                console.log("No documents found!");
                req.flash("error", "No existed");
                res.header(400).json({ status: "fail" });
            } else {
                loadedData = sentdata;
                // clearInterval(interval);
                // var interval = setInterval(intervalFunction, 3600*1000);
                // var interval = setInterval(intervalFunction, delaytime);
                res.header(200).json({
                    status: "success",
                    loadedData: loadedData,
                    data: sentdata,
                    delaytime: delaytime,
                });
            }
        } finally {
            await client.close();
        }
    }
    run().catch((err) => {
        console.log("mongodb connect error ========");
        console.error(err);
        //  process.exit(1)
        req.flash("error", err);
        // redirect to users list page
        res.render("pages/data", {
            title: "Model DB - Owl Studio Web App",
            // data: sentdata,
            data: [],
        });
    });
});

app.post("/getloadflag", auth, async function (req, res, next) {
    console.log("*********** data **** get loadflag ********");
    if(req.session.loadedFlag == false && loadedFlag == true){
        req.session.loadedFlag = true;
        res.send('success');
    }else{
        req.session.loadedFlag = false;
        res.send('failed');
    }
});
// async function intervalFunction() {
//     try {
//         const client = new MongoClient("mongodb://localhost:27017/", {
//             useUnifiedTopology: true,
//             useNewUrlParser: true,
//             connectTimeoutMS: 30000,
//             keepAlive: 1,
//         });
//         let allmembers = await Setting.find();
//         await client.connect();
//         let sentdata = [];
//         /* connect all collections */
//         for (let mem of allmembers) {
//             /* get cursor */
//             let db = mem.dbname.trim();
//             let col = mem.collectionname.trim();
//             if (db === "delaytime") {
//                 continue;
//             }

//             const database = client.db(db);
//             const datas = database.collection(col);
//             // const cursor = datas.find({}).sort([['datetime', -1]]);
//             const cursor = datas.aggregate([{ $sort: { datetime: -1 } }], {
//                 allowDiskUse: true,
//             });

//             await cursor.forEach(function (model) {
//                 let splitdata = model.datetime.split(" ");
//                 let eachmodeldata = {
//                     _id: model._id,
//                     date: splitdata[0],
//                     time: splitdata[1],
//                     name: model.measurement[0].name,
//                     mass: model.measurement[0].mass,
//                     volume: model.measurement[0].volume,
//                     setid: mem._id.toString(),
//                 };
//                 sentdata.push(eachmodeldata);
//             });
//         }
//         loadedData = sentdata;
//         console.log("load ended");
//     } catch (error) {
//         throw error;
//         console.log("load failed");
//     }
// }
module.exports = app;
