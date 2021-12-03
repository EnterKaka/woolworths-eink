var express = require("express");
var app = express();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const Setting = require("../model/Setting");
const Value = require("../model/Value");
const Joi = require("joi");
var ObjectId = require("mongoose").Types.ObjectId;
const fs = require("fs");
const logger = fs.createWriteStream("user-log/oe_server_logfile.txt", {
    flags: "a", // 'a' means appending (old data will be preserved)
});
async function writeLog(msg) {
    logger.write(msg + "\r\n");
    console.log(msg);
}

// SHOW LIST OF USERS
app.get("/", auth, admin, async function (req, res, next) {
    // fetch and sort users collection by id in descending order
    let path = await Value.findOne({ name: "path" });
    if (!path) path = "";
    else path = path.value;
    let dtime = await Value.findOne({ name: "dtime" });
    if (!dtime) dtime = "1";
    else dtime = dtime.value;
    let allmembers = await Setting.find();
    res.render("pages/setting/list", {
        data: allmembers,
        path: path,
        dtime: dtime,
    });
});
app.post("/setpath", auth, admin, async function (req, res, next) {
    let val = {
        name: "path",
        value: req.body.path,
    };
    await Value.deleteOne({ name: "path" });
    let v_setting = new Value(val);
    await v_setting.save();
    val = {
        name: "dtime",
        value: req.body.dtime,
    };
    await Value.deleteOne({ name: "dtime" });
    v_setting = new Value(val);
    await v_setting.save();
    dtime = req.body.dtime * 60000;
    var str = 'Username:' + req.session.user_info.email + ' Path: '+ req.body.path +' DelayTime:'+ req.body.dtime +' Time:' + (new Date());
    writeLog('Setting Changed ('+str+')');
    res.send();
});
// SHOW ADD USER FORM
app.get("/add", auth, admin, function (req, res, next) {
    // render to views/pages/members/add.ejs
    res.render("pages/setting/add", {
        title: "Add New Setting - Owl Studio",
        dbname: "",
        collectionname: "",
    });
});

// ADD NEW USER POST ACTION
app.post("/add", auth, admin, async function (req, res, next) {
    const querySchema = Joi.object({
        dbname: Joi.string().required(),
        collectionname: Joi.string().required(),
    });
    const { error } = querySchema.validate(req.body);
    if (error) {
        req.flash("error", error);
        res.render("pages/setting/add");
    } else {
        //find an existing user
        let onesetting = await Setting.findOne({
            dbname: req.body.dbname,
            collectionname: req.body.collectionname,
        });
        if (onesetting) {
            req.flash("error", "This Setting is already existed in database");
            res.render("pages/setting/add");
            return;
        }

        let v_setting = new Setting({
            dbname: req.body.dbname,
            collectionname: req.body.collectionname,
        });
        var str = 'Username:' + req.session.user_info.email + ' Database:' + req.body.dbname + ' Collectionname: '+ req.body.collectionname +' Time:' + (new Date());
        writeLog('Database Added in Setting Page ('+str+')');
    
        await v_setting.save();
        req.flash("success", "New User is added successfully!");
        res.redirect("/setting");

        // const token = user.generateAuthToken();
    }
});

// SHOW EDIT USER FORM
app.get("/edit/(:_id)", auth, admin, async function (req, res, next) {
    let mem = await Setting.findOne({ _id: new ObjectId(req.params._id) });
    if (mem) {
        res.render("pages/setting/edit", {
            _id: mem._id,
            dbname: mem.dbname,
            collectionname: mem.collectionname,
        });
    } else {
        res.redirect("/setting");
    }
});

// EDIT USER POST ACTION
app.post("/edit/(:_id)", auth, admin, async function (req, res, next) {
    const querySchema = Joi.object({
        dbname: Joi.string().required(),
        collectionname: Joi.string().required(),
    });
    const { error } = querySchema.validate(req.body);
    if (error) {
        req.flash("error", error);
        res.redirect("/setting/edit/<%- res.params._id %>");
    } else {
        let v_user = {
            dbname: req.body.dbname,
            collectionname: req.body.collectionname,
        };
        let prev = await Setting.findOne(
            { _id: new ObjectId(req.params._id) });
        var str = 'Username:' + req.session.user_info.email + ' Database:' + prev.dbname + '=>'+ v_user.dbname +' Collectionname: '+ prev.collectionname +'=>'+v_user.collectionname+' Time:' + (new Date());
        writeLog('Database Changed in Setting Page ('+str+')');
        let mem = await Setting.findOneAndUpdate(
            { _id: new ObjectId(req.params._id) },
            v_user
        );
        req.flash(
            "success",
            "The Setting Information has updated successfully"
        );
        return res.redirect("/setting");
    }
});

// DELETE USER
app.get("/delete/(:_id)", auth, admin,async function (req, res, next) {
    var _id = new ObjectId(req.params._id);
    let prev = await Setting.findOne(
        { _id: _id });
    var str = 'Username:' + req.session.user_info.email + ' Database:' + prev.dbname +' Collectionname: '+ prev.collectionname +' Time:' + (new Date());
    writeLog('Database Deleted in Setting Page ('+str+')');
    Setting.findOneAndDelete({ _id: _id }, function (err, docs) {
        if (err) {
            req.flash("error", err);
            // redirect to users list page
            res.header(400).json({ status: "fail" });
        } else {
            req.flash(
                "success",
                "User deleted successfully! email = " + req.params._id
            );
            // redirect to users list page
            res.header(200).json({ status: "success" });
        }
    });
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
