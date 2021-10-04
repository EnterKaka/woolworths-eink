var express = require('express');
var app = express();
const Model = require('../model/Model');
const mongoose = require('mongoose');
const MongoClient = require("mongodb").MongoClient;
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
	const client = new MongoClient('mongodb://localhost:27017/', { useUnifiedTopology: true });
	client
	.connect()
	.then(
	client =>
		client
		.db(dbname)
		.collection(collectionname)// Returns a promise that will resolve to the list of the collections
	)
	.then(conn => console.log("Collections", conn.db))
	.finally(() => client.close());

	mongoose
   .connect(db_uri, { // 'mongodb://127.0.0.1:27017'            process.env.MONGO_URI
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
		var ModelSchema = new Schema({
			datetime: String,
			measurement: [],
			modifeod: String,
			name: String,
		});
		try{
			var data = mongoose.model(collectionname, ModelSchema);
			data.find(function(err, docs){
				if(err){
					console.log('error');
					console.error(error)
					//  process.exit(1)
					req.flash('error', error)
					// redirect to users list page
					res.header(400).json({status: 'fail'});
				}else{
					console.log('success get data',docs);
					req.flash('success', 'Data loaded successfully! DB = ' + dbname)
					// redirect to users list page
					res.header(200).json({status: 'success'});
				}
			});
		}catch(error){
			console.log("mongodb model error ========");
			console.error(error)
			//  process.exit(1)
			req.flash('error', error)
			// redirect to users list page
			res.header(400).json({status: 'fail'});
		}
    }).catch((err) => {
         console.log("mongodb connect error ========");
         console.error(err)
        //  process.exit(1)
		req.flash('error', err)
		// redirect to users list page
		res.header(400).json({status: 'fail'});
    });
});

module.exports = app;