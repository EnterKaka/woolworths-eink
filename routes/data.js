var express = require('express');
var app = express();
const MongoClient = require("mongodb").MongoClient;
var ObjectId = require('mongoose').Types.ObjectId;
const auth = require("../middleware/auth");
const Setting = require('../model/Setting');

var dbname = 'OwlEyeStudioWebInterface' , collectionname = 'models';

// SHOW LIST OF USERS
app.get('/', auth, async function(req, res, next) {
	const client = new MongoClient('mongodb://localhost:27017/', { useUnifiedTopology: true });
	let allmembers = await Setting.find();
	var dbs = [], collections = [];
	let found = false;
	allmembers.forEach( function(mem){
		let db = mem.dbname.trim();
		let col = mem.collectionname.trim();
		found = false;
		for (var i = 0; i < dbs.length && !found; i++) {
			if (dbs[i] === db) {
			  found = true;
			  break;
			}
		}
		if(!found){
			dbs.push(db);
		}

		found = false;
		for (var i = 0; i < collections.length && !found; i++) {
			if (collections[i] === col) {
			  found = true;
			  break;
			}
		}
		if(!found){
			collections.push(col);
		}
	});
	console.log(dbs, collections);

	console.log('/data/--------',dbname, collectionname);
	//session dbname and collection name save
	req.session.dbname = dbname;
	req.session.collectionname = collectionname;

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
				console.log('/data/-----',dbname, collectionname);
				res.render('pages/data', {
					title: 'Model DB - Owl Studio Web App',
					dbname: dbname,//seleted db
					collectionname: collectionname,//selected collection
					data: sentdata,
					dbs: dbs,//db list
					collections: collections//collection list
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
				req.flash('pcl_name', cursor.measurement[0].name)
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
	dbname = req.body.dbname;
	collectionname = req.body.collectionname;

	//session dbname and collection name save
	req.session.dbname = dbname;
	req.session.collectionname = collectionname;
	
	const client = new MongoClient('mongodb://localhost:27017/', { useUnifiedTopology: true });
	let allmembers = await Setting.find();
	let dbs = [], collections = [];
	allmembers.forEach( function(mem){
		let db = mem.dbname.trim();
		let col = mem.collectionname.trim();
		found = false;
		for (var i = 0; i < dbs.length && !found; i++) {
			if (dbs[i] === db) {
			  found = true;
			  break;
			}
		}
		if(!found){
			dbs.push(db);
		}

		found = false;
		for (var i = 0; i < collections.length && !found; i++) {
			if (collections[i] === col) {
			  found = true;
			  break;
			}
		}
		if(!found){
			collections.push(col);
		}
	});

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
				console.log('success get data');
				// console.log(sentdata);
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
				data: [],
				dbs:dbs,
				collections: collections,
			});
		}
	);
});

module.exports = app;