var express = require('express');
var app = express();
const Model = require('../model/Model');
const mongoose = require('mongoose')
var Schema = mongoose.Schema;

// SHOW LIST OF USERS
app.get('/', async function(req, res, next) {	
	let modelsdata = await Model.find();
	let sentdata = [];
	modelsdata.forEach(function(model) {
		let eachmodeldata = {
			datetime: model.datetime,
			name: model.measurement[0].name,
			mass: model.measurement[0].mass,
			volume: model.measurement[0].volume,
		}
		sentdata.push(eachmodeldata);
	});

	res.render('pages/data', {
		title: 'Model DB - Owl Studio Web App',
		dbname: 'OwlEyeStudioWebInterface',
		collectionname: 'models',
		data: sentdata,
	})
});

app.get('/view/(:datetime)', async function(req, res, next) {
	let model = await Model.findOne({datetime: req.params.datetime})
	var pcl = model.measurement[0].pointcloud;
	console.log('point cloud ========================');
	req.flash("pointcloud", JSON.stringify(pcl));
	res.redirect('/viewer');
});

app.post('/get', async function(req, res, next) {
	let dbname = req.body.dbname;
	let collectionname = req.body.collectionname;
	let db_uri = 'mongodb://localhost:27017/' + dbname;
	mongoose
   .connect(db_uri, { // 'mongodb://127.0.0.1:27017'            process.env.MONGO_URI
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log('connected to db', db_uri);

		var ModelSchema = new Schema({
			datetime: String,
			measurement: [],
			modifeod: String,
			name: String,
		});
		
		var data = mongoose.model(collectionname, ModelSchema);
		let modeldata = data.find();
		console.log(modeldata);


		req.flash('success', 'Data loaded successfully! DB = ' + dbname)
		// redirect to users list page
		res.header(200).json({status: 'success'});
    }).catch((err) => {
         console.log("mongodb connect error ========");
         console.error(err)
        //  process.exit(1)
		req.flash('error', err)
		// redirect to users list page
		res.header(400).json({status: 'fail'});
    })
});

module.exports = app;