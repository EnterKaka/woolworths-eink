var express = require('express');
var app = express();
const MongoClient = require("mongodb").MongoClient;
var ObjectId = require('mongoose').Types.ObjectId;
const auth = require("../middleware/auth");
const Setting = require('../model/Setting');

var dbname = 'OwlEyeStudioWebInterface' , collectionname = 'models';

// SHOW LIST OF USERS
app.get('/', auth, async function(req, res, next) {
	
	// console.log("*********** data ************")

	// /* get all collections */
	// const client = new MongoClient('mongodb://localhost:27017/', { useUnifiedTopology: true, useNewUrlParser: true, connectTimeoutMS: 30000 , keepAlive: 1});
	// let allmembers = await Setting.find();

	async function run() {
		try {
			// await client.connect();
			// let sentdata = [];
			
			// /* connect all collections */
			// for(let mem of allmembers){
			// 	/* get cursor */
			// 	let db = mem.dbname.trim();
			// 	let col = mem.collectionname.trim();
			// 	const database = client.db(db);
			// 	const datas = database.collection(col);
			// 	const cursor = datas.find({}).sort([['datetime', -1]]);

			// 	await cursor.forEach(function(model) {
			// 		let splitdata = model.datetime.split(' ');
			// 		let eachmodeldata = {
			// 			_id: model._id,
			// 			date: splitdata[0],
			// 			time: splitdata[1],
			// 			name: model.measurement[0].name,
			// 			mass: model.measurement[0].mass,
			// 			volume: model.measurement[0].volume,
			// 		}
			// 		sentdata.push(eachmodeldata);
			// 	});
			// };
			// print a message if no documents were found
			// if (sentdata.length === 0) {
			// 	console.log("No documents found!");
			// 	req.flash('error', 'No existed');
			// 	res.header(400).json({status: 'fail'});
			// }else{
				res.render('pages/data', {
					title: 'Model DB - Owl Studio Web App',
					loadedData:loadedData,
					data: (loadedData === '')?[]:loadedData,
					// data: sentdata,
				});
			// }
		} finally {
			// await client.close();
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
				// data: sentdata,
				data: [],
			});
		}
	);
});

app.get('/view/(:_id)', auth, async function(req, res, next) {
	// let model = await Model.findOne({datetime: req.params.datetime})
	const client = new MongoClient('mongodb://localhost:27017/', { useUnifiedTopology: true });

	console.log('/data/view/_id--------',dbname, collectionname);
	async function run() {
		try {
			await client.connect();
			const database = client.db(dbname);
			const datas = database.collection(collectionname);
			// query for movies that have a runtime less than 15 minutes
			const cursor = await datas.findOne({_id: new ObjectId(req.params._id) });
			// console.log(cursor);
			// print a message if no documents were found
			if (cursor) {
				// replace console.dir with your callback to access individual elements
				console.log('success get data');
				req.flash('success', 'Data loaded successfully! DB = ' + dbname)
				// redirect to users list page
				var pcl = cursor.measurement[0].pointcloud;
				console.log('point cloud ========================');
				req.flash("pointcloud", JSON.stringify(pcl));
				req.flash('pcl_name', cursor.measurement[0].name);
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

app.post('/view/(:id)', auth, async function(req, res, next) {
	var id = req.params.id;
	console.log('dblclk-----get model id-----', id, dbname, collectionname);
	// let model = await Model.findOne({datetime: req.params.datetime})
	const client = new MongoClient('mongodb://localhost:27017/', { useUnifiedTopology: true });
	async function run() {
		try {
			await client.connect();
			const database = client.db(dbname);
			const datas = database.collection(collectionname);
			// query for movies that have a runtime less than 15 minutes
			const cursor = await datas.findOne({_id: new ObjectId(id) });
			// console.log(cursor);
			// print a message if no documents were found
			if (cursor) {
				// replace console.dir with your callback to access individual elements
				var pcl = cursor.measurement[0].pointcloud;
				res.header(200).json({
					status: 'sucess',
					data: pcl,
					name: cursor.measurement[0].name,
				});
			}else{
				res.header(400).json({
					status: 'fail',
					data: 'no model'
				});
			}
		} finally {
			await client.close();
		}
	}
	run().catch(
		(err) => {
			res.header(400).json({
				status: 'fail',
				error: err,
			});
		}
	);
	
});

app.post('/get', auth, async function(req, res, next) {
		
	console.log("*********** data **** get ********")

	/* get all collections */
	const client = new MongoClient('mongodb://localhost:27017/', { useUnifiedTopology: true, useNewUrlParser: true, connectTimeoutMS: 30000 , keepAlive: 1});
	let allmembers = await Setting.find();

	async function run() {
		try {
			await client.connect();
			let sentdata = [];
			/* connect all collections */
			for(let mem of allmembers){
				/* get cursor */
				let db = mem.dbname.trim();
				let col = mem.collectionname.trim();
				const database = client.db(db);
				const datas = database.collection(col);
				const cursor = datas.find({}).sort([['datetime', -1]]);

				await cursor.forEach(function(model) {
					let splitdata = model.datetime.split(' ');
					let eachmodeldata = {
						_id: model._id,
						date: splitdata[0],
						time: splitdata[1],
						name: model.measurement[0].name,
						mass: model.measurement[0].mass,
						volume: model.measurement[0].volume,
					}
					sentdata.push(eachmodeldata);
				});
			};
			// print a message if no documents were found
			if (sentdata.length === 0) {
				console.log("No documents found!");
				req.flash('error', 'No existed');
				res.header(400).json({status: 'fail'});
			}else{
				loadedData = sentdata;
				res.header(200).json({
					status: 'success',
					loadedData:loadedData,
					data: sentdata,
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
				// data: sentdata,
				data: [],
			});
		}
	);
});

module.exports = app;