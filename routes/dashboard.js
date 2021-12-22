var express = require("express");
var app = express();
const auth = require("../middleware/auth");
const MongoClient = require("mongodb").MongoClient;
const Setting = require("../model/Setting");
const Y_min_max = require("../model/Y_min_max");
const Actual_material_name = require("../model/Actual_material_name");

var ObjectId = require("mongoose").Types.ObjectId;
const fs = require("fs");
const logger = fs.createWriteStream("user-log/oe_server_logfile.txt", {
    flags: "a", // 'a' means appending (old data will be preserved)
});
async function writeLog(msg) {
    logger.write(msg + "\r\n");
    console.log(msg);
}

app.post("/set_y_axis", async function (req, res) {
    try {
        await Y_min_max.deleteOne({ name: req.body.name });
        let v_setting = new Y_min_max(req.body);
        await v_setting.save();
        res.send('success');        
    } catch (error) {
        res.send('failed');
    }
});

app.post("/set_material_name", async function (req, res) {
    try {
        let setobj = await Setting.find();
        var flag = false;
        const client = new MongoClient("mongodb://localhost:27017/", {
            useUnifiedTopology: true,
        });
        await client.connect();
        for (let ele of setobj) {
            let dbname = ele.dbname;
            let collectionname = ele.collectionname;
            let database = client.db(dbname);
            let datas = database.collection(collectionname);
            let cursor = datas.aggregate(
                [
                    {
                        $project: {
                            "measurement.name":true,
                            isBetween: {
                                $and: [{
                                    $lte: [{
                                        $dateFromString: {
                                            dateString: { "$arrayElemAt": ["$measurement.date", 0] }
                                        }
                                    }, {
                                        $dateFromString: {
                                            dateString: req.body.to,
                                        }
                                    }]
                                }, {
                                    $gte: [{
                                        $dateFromString: {
                                            dateString: { "$arrayElemAt": ["$measurement.date", 0] }
                                        }
                                    }, {
                                        $dateFromString: {
                                            dateString: req.body.from,
                                        }
                                    }]
                                }]
                            }
                        }
                    },
                    {
                        $match: {
                            $and:[
                                {
                                    "isBetween": true
                                },
                                {"measurement.name":req.body.name}
                            ]   
                        }
                    },
                ], {
                    allowDiskUse: true,
            });
            cursor.forEach(function(myDoc){
                datas.updateOne({ _id: myDoc._id }, {$set:{"measurement.0.material_name": req.body.material_name}});
            });
        }
        res.send('success');
    } catch (error) {
        res.send('failed');
    }
});
app.post("/set_actual_material_name", async function (req, res) {
    try {
        await Actual_material_name.deleteOne({ model_name: req.body.model_name });
        let v_setting = new Actual_material_name(req.body);
        await v_setting.save();
        res.send('success');
    } catch (error) {
        res.send('failed');
    }
});

/**
 * We assign app object to module.exports
 *
 * module.exports exposes the app object as a module
 *
 * module.exports should be used to return the object
 * when this file is required in another module like app.js
 */
module.exports = app;
