var express = require("express");
var app = express();
const auth = require("../middleware/auth");
const User = require("../model/User");
const Joi = require("joi");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const MongoClient = require("mongodb").MongoClient;
const Setting = require("../model/Setting");
var ObjectId = require("mongoose").Types.ObjectId;
const ip = require("ip");
const fs = require("fs");
const logger = fs.createWriteStream("user-log/oe_server_logfile.txt", {
    flags: "a", // 'a' means appending (old data will be preserved)
});
async function writeLog(msg) {
    logger.write(msg + "\r\n");
    console.log(msg);
}
app.use(function(req, res, next) {
    res.locals.user = req.session.user_info;
    next();
});
app.get("/", function (req, res) {
    // render to views/index.ejs template file
    res.redirect("/dashboard");
});

app.get("/viewer", auth, async function (req, res) {
    // render to views/index.ejs template file
    console.log("******** load view ************");

    res.render("pages/viewer", {
        title: "3D Viewer - Owl Studio Web App",
        priv: req.user.privilege,
        model_data: "",
    });
    // }
    // else{
    // 	res.redirect('/data/');
    // }
});
app.get("/editer", function (req, res) {
    // render to views/index.ejs template file

    res.render("pages/editer", {
        title: "Owl Eye 3D Editor",
        // priv: req.user.privilege,
        // priv: 'moscow',
        model_data: "",
    });
});

app.get("/dashboard", auth, function (req, res) {
    console.log("********* load dashboard page ************");
    if (loadedData === "") res.redirect("/data");
    else{
        const client = new MongoClient("mongodb://localhost:27017/", {
            useUnifiedTopology: true,
        });
        //This is all models that seperated with name.
        var allmodels = [];
        var allnames = [];
    
        let server_ip = ip.address();

        async function run() {
            try {
                // replace console.dir with your callback to access individual elements
                var lastmodelname; //for current item for update
                for (const model of loadedData) {
                    let modelname = model.name;
                    let eachmodeldata = {
                        _id: model._id,
                        datetime: model.date + " " + model.time,
                        mass: model.mass,
                        volume: model.volume,
                    };
                    let stored = false;
                    for (const element of allmodels) {
                        if (element.name === modelname) {
                            element.log.push(eachmodeldata);
                            stored = true;
                            break;
                        }
                    }
    
                    if (stored == false) {
                        let temp_model = {
                            name: modelname,
                            log: [],
                        };
                        temp_model.log.push(eachmodeldata);
                        allmodels.push(temp_model);
                        allnames.push(modelname);
                    }
                    lastmodelname = modelname; //for name sort by current datetime
                }
                allmodels = makeSortedDatasbytime(lastmodelname, allmodels);
                // //sucess
                if (loadedData !== "") {
                    /* load general data default */
                    var result = [];
                    loadedData.filter((obj) => {
                        if (obj.name.toLowerCase() === "general") result.push(obj);
                    });
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
                    var latest = result.shift();
                    let setobj = await Setting.findOne({
                        _id: new ObjectId(latest.setid),
                    });
                    let dbname = setobj.dbname;
                    let collectionname = setobj.collectionname;
                    await client.connect();
                    const database = client.db(dbname);
                    const datas = database.collection(collectionname);
                    // query for movies that have a runtime less than 15 minutes
                    const cursor = await datas.findOne({
                        _id: new ObjectId(latest._id),
                    });
                    // console.log(cursor);
                    // print a message if no documents were found
                    if (cursor) {
                        // replace console.dir with your callback to access individual elements
                        var pcl = cursor.measurement[0].pointcloud;
                        req.flash("pointcloud", JSON.stringify(pcl));
                        var format = (
                            Math.round(cursor.measurement[0].volume * 100) / 100
                        ).toFixed(2);
                        req.flash(
                            "pcl_name",
                            cursor.measurement[0].name +
                                " : " +
                                cursor.measurement[0].date +
                                " " +
                                cursor.measurement[0].time
                        );
                    }
                    res.render("pages/dashboard", {
                        title: "Dashboard - Owl Studio Web App",
                        data: allmodels,
                        loadedData: loadedData,
                        server_ip: server_ip,
                        names: allnames,
                        delaytime: delaytime,
                    });
                } else {
                    res.redirect("/data/");
                }
            } finally {
            }
        }
        run().catch((err) => {
            console.log("mongodb connect error ========");
            console.error(err);
            req.flash("error", err);
            // redirect to users list page
            res.render("pages/dashboard", {
                title: "Model DB - Owl Studio Web App",
            });
        });
    }
        
});

app.get("/login", function (req, res) {
    // render to views/index.ejs template file
    res.render("pages/login", { title: "Login - Owl Studio Web App" });
});

app.get("/logout", function (req, res) {
    var str = 'Time:' + (new Date());
    writeLog('Logout: ' + req.session.user_info.email + ' ('+str+')');
    // loadedData = "";
    req.session.destroy();
    return res.redirect("/");
});

app.post("/login", async function (req, res) {
    const querySchema = Joi.object({
        email: Joi.string().required(),
        pass: Joi.string().required(),
    });
    const { error } = querySchema.validate(req.body);
    if (error) {
        return res.redirect("/login");
    }
    let user1;
    if (req.body.email.includes("@")) {
        user1 = await User.findOne({ email: req.body.email });
    } else {
        user1 = await User.findOne({ name: req.body.email });
    }
    let token = jwt.sign({ ...user1 }, config.get("myprivatekey"));
    if (user1) {
        if (bcrypt.compareSync(req.body.pass, user1.pass)) {
            req.session.accessToken = token;
            req.session.user_info = user1;
            req.session.loadedFlag = false;
            await req.session.save();
            var str = 'Time:' + (new Date());
            writeLog('Login: ' + req.session.user_info.email + ' ('+str+')');
            res.redirect("/");
        } else {
            for (const key in req.body) {
                if (Object.hasOwnProperty.call(req.body, key)) {
                    req.flash(key, req.body[key]);
                }
            }
            req.flash("error", "Password is incorrect.");
            res.render("pages/login", {
                title: "3D Viewer - Owl Studio Web App",
            });
        }
    } else {
        // default login feature
        // var email = req.body.email.trim();
        // var pass = req.body.pass.trim();
        // if((email == 'admin@oe-web.com' ) && (pass == 'admin1234' )){
        // 	let v_user = new User({
        // 		name: 'Quirin Kraus',
        // 		pass: 'admin1234',
        // 		email: 'admin@oe-web.com',
        // 		privilege: 'admin',
        // 	});
        // 	v_user.pass = await bcrypt.hash(v_user.pass, 10);
        // 	await v_user.save();
        // 	let user1 = await User.findOne({ email: req.body.email });
        // 	let token = jwt.sign({...user1}, config.get("myprivatekey"));
        // 	req.session.accessToken = token;
        // 	await req.session.save();
        // 	res.redirect('/');
        // }
        // for (const key in req.body) {
        // 	if (Object.hasOwnProperty.call(req.body, key)) {
        // 		req.flash(key, req.body[key])
        // 	}
        // }
        if (req.body.email.includes("@")) {
            req.flash("error", "Email is not registered");
        } else {
            req.flash("error", "UserName is not registered");
        }
        res.render("pages/login", { title: "3D Viewer - Owl Studio Web App" });
    }
});

function makeSortedDatasbytime(lastmodelname, allmodels) {
    var sorteddata = allmodels,
        tmp_data,
        i = 0;
    for (const element of allmodels) {
        if (element.name === lastmodelname) {
            tmp_data = sorteddata.slice(i, i + 1);
            sorteddata.splice(i, 1);
            break;
        }
        i = i + 1;
    }
    sorteddata = sorteddata.concat(tmp_data);
    sorteddata.reverse();
    return sorteddata;
}
/**
 * We assign app object to module.exports
 *
 * module.exports exposes the app object as a module
 *
 * module.exports should be used to return the object
 * when this file is required in another module like app.js
 */
module.exports = app;
