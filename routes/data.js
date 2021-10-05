var express = require('express');
var app = express();
const Model = require('../model/Model');
const MongoClient = require("mongodb").MongoClient;

var dbname, collectionname;

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

	dbname = 'OwlEyeStudioWebInterface';
	collectionname = 'models';
	console.log('/data/-----',dbname, collectionname);
	res.render('pages/data', {
		title: 'Model DB - Owl Studio Web App',
		dbname: dbname,
		collectionname: collectionname,
		data: sentdata,
	});
});

app.get('/view/(:datetime)', async function(req, res, next) {
	// let model = await Model.findOne({datetime: req.params.datetime})
	const client = new MongoClient('mongodb://localhost:27017/', { useUnifiedTopology: true });

	console.log('/data/view/datetime--------',dbname, collectionname);
	async function run() {
		try {
			await client.connect();
			const database = client.db(dbname);
			const datas = database.collection(collectionname);
			// query for movies that have a runtime less than 15 minutes
			const cursor = await datas.findOne({datetime: req.params.datetime});
			console.log(cursor);
			// print a message if no documents were found
			if (cursor) {
				// replace console.dir with your callback to access individual elements
				console.log('success get data');
				req.flash('success', 'Data loaded successfully! DB = ' + dbname)
				// redirect to users list page
				var pcl = cursor.measurement[0].pointcloud;
				console.log('point cloud ========================');
				req.flash("pointcloud", JSON.stringify(pcl));
				res.redirect('/viewer');
			}else{
				console.log("No documents found!");
		   		req.flash('error', 'No existed');
		   		// redirect to users list page
		   		res.redirect('/data/');
			}
		} finally {
			await client.close();
		}
	}
	run().catch(
		(err) => {
			console.log("mongodb connect error ========");
			console.error(err)
		   	//  process.exit(1)
		   	req.flash('error', err)
		   	// redirect to users list page
		   	res.redirect('/data/');
		}
	);

	
});

app.post('/get', async function(req, res, next) {
	dbname = req.body.dbname;
	collectionname = req.body.collectionname;
	const client = new MongoClient('mongodb://localhost:27017/', { useUnifiedTopology: true });
	
	console.log('/data/get/--------',dbname, collectionname);
	async function run() {
		try {
			await client.connect();
			const database = client.db(dbname);
			const datas = database.collection(collectionname);
			// query for movies that have a runtime less than 15 minutes
			const cursor = datas.find({});
			let sentdata = [];
			// print a message if no documents were found
			if ((await cursor.count()) === 0) {
				console.log("No documents found!");
		   		//  process.exit(1)
		   		req.flash('error', 'No existed');
		   		// redirect to users list page
		   		res.header(400).json({status: 'fail'});
			}else{
				// replace console.dir with your callback to access individual elements
				await cursor.forEach(function(model) {
					let eachmodeldata = {
						datetime: model.datetime,
						name: model.measurement[0].name,
						mass: model.measurement[0].mass,
						volume: model.measurement[0].volume,
					}
					sentdata.push(eachmodeldata);
				});
				console.log('success get data');
				console.log(sentdata);
				req.flash('success', 'Data loaded successfully! DB = ' + dbname)
				// redirect to users list page
				res.header(200).json({
					status: 'success',
					data: sentdata 
				});
			}
		} finally {
			await client.close();
		}
	}
	run().catch(
		(err) => {
			console.log("mongodb connect error ========");
			console.error(err)
		   	//  process.exit(1)
		   	req.flash('error', err)
		   	// redirect to users list page
		   	res.render('pages/data', {
				title: 'Model DB - Owl Studio Web App',
				dbname: dbname,
				collectionname: collectionname,
				data: sentdata,
			});
		}
	);
});

module.exports = app;