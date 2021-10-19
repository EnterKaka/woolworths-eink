var express = require('express');
var app = express();
const MongoClient = require("mongodb").MongoClient;
var ObjectId = require('mongoose').Types.ObjectId;
const auth = require("../middleware/auth");
const Setting = require('../model/Setting');

/* load data page */
app.get('/', auth, async function(req, res, next) {
	
	console.log("*********** load data page ************")

	async function run() {
		try {
				res.render('pages/data', {
					title: 'Model DB - Owl Studio Web App',
					loadedData:loadedData,
					data: (loadedData === '')?[]:loadedData,
				});
		} finally {
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
				loadedData:loadedData,
				data: [],
			});
		}
	);
});

/* click view button in data page*/

app.get('/view/(:_id)', auth, async function(req, res, next) {

	console.log("*********** data ******* view(click in data page) ***");

	const client = new MongoClient('mongodb://localhost:27017/', { useUnifiedTopology: true });

	async function run() {
		try {
			/* find object in loaded data*/
			var id = req.params._id;
			let obj = loadedData.find((o)=>{
				if(o._id.toString()===id)
					return true;
			});

			/* find setting data by setting id*/
			let setobj = await Setting.findOne({_id: new ObjectId(obj.setid) });
			
			/* get pointcloud from collection */
			let dbname = setobj.dbname;
			let collectionname = setobj.collectionname;
			await client.connect();
			const database = client.db(dbname);
			const datas = database.collection(collectionname);
			const cursor = await datas.findOne({_id: new ObjectId(id) });
			
			if (cursor) {
				console.log('success get data');
				req.flash('success', 'Data loaded successfully! DB = ' + dbname)
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

	const client = new MongoClient('mongodb://localhost:27017/', { useUnifiedTopology: true });

	console.log("*********** data ******* view(click graph) ***");

	async function run() {
		try {
			var id = req.params.id;
			let obj = loadedData.find((o)=>{
				if(o._id.toString()===id)
				return true;
			});
			let setobj = await Setting.findOne({_id: new ObjectId(obj.setid) });
			let dbname = setobj.dbname;
			let collectionname = setobj.collectionname;
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

/* click get data button in data page */

app.post('/get', auth, async function(req, res, next) {
		
	console.log("*********** data **** get data ********")

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
				// const cursor = datas.find({}).sort([['datetime', -1]]);
				const cursor = datas.aggregate([{$sort:{'datetime':-1}}],{allowDiskUse: true});

				await cursor.forEach(function(model) {
					let splitdata = model.datetime.split(' ');
					let eachmodeldata = {
						_id: model._id,
						date: splitdata[0],
						time: splitdata[1],
						name: model.measurement[0].name,
						mass: model.measurement[0].mass,
						volume: model.measurement[0].volume,
						setid: mem._id.toString(),
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