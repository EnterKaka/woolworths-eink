var express = require("express");
var app = express();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const Setting = require("../model/Setting");
const Joi = require("joi");
const exec = require("child_process").execFile;
const { spawn } = require("child_process");
// const { networkInterfaces } = require("os");
const ip = require("ip");
var children = [];
app.get("/", auth, async function (req, res) {
    // render to views/index.ejs template file
    console.log("******** load oes_control ************");
    // const nets = networkInterfaces();
    let server_ip = ip.address();
    let schedule_data = [
        { day: "Monday" },
        { day: "Tuesday" },
        { day: "Wednesday" },
        { day: "Thursday" },
        { day: "Friday" },
        { day: "Saturday" },
        { day: "Sunday" },
    ];
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
        schedule_data: schedule_data,
        path: "C:\\Windows\\notepad.exe",
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
/**
 * We assign app object to module.exports
 *
 * module.exports exposes the app object as a module
 *
 * module.exports should be used to return the object
 * when this file is required in another module like app.js
 */
module.exports = app;
