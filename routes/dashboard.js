var express = require("express");
var app = express();
const auth = require("../middleware/auth");
const MongoClient = require("mongodb").MongoClient;
const Y_min_max = require("../model/Y_min_max");
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

/**
 * We assign app object to module.exports
 *
 * module.exports exposes the app object as a module
 *
 * module.exports should be used to return the object
 * when this file is required in another module like app.js
 */
module.exports = app;
