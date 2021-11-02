var express = require('express');
var app = express();
const MongoClient = require("mongodb").MongoClient;
var ObjectId = require('mongoose').Types.ObjectId;
const Setting = require('../model/Setting');


/*
 * API - all models (timeinterval or latest) 
 * @param-from: to: latest:
*/
app.post('/allmodels/timeinterval', async function(req, res, next) {

	console.log("*********** API **** allmodel ****** timeinterval  ********");
	let fromTime = req.body.from;
	if(typeof fromTime === 'undefined')
		fromTime = '1900.01.01 00:00:00';
	fromTime = new Date(fromTime);
	let toTime = req.body.to;
	if(typeof toTime === 'undefined')
		toTime = new Date();
	else
		toTime = new Date(toTime);
	if(fromTime > toTime) {
		res.header(400).json({status: 'failed', reason: 'No document found.'});
		console.log('here');
	}
	async function run() {
		try {
			/* if loadedData is empty, get data from db */
			if(loadedData === ''){
				const client = new MongoClient('mongodb://localhost:27017/', { useUnifiedTopology: true, useNewUrlParser: true, connectTimeoutMS: 30000 , keepAlive: 1});
				/* get all collections */
				let allmembers = await Setting.find();
				/* DB connect */
				await client.connect();
				let sentdata = [];
				/* connect all collections */
				for(let mem of allmembers){
					/* get cursor */
					let db = mem.dbname.trim();
					let col = mem.collectionname.trim();
					if(db === 'delaytime'){
						continue;
					}
					const database = client.db(db);
					const datas = database.collection(col);
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
				if (sentdata.length === 0) {
					console.log("No documents found!");
					res.header(400).json({status: 'failed', reason: 'No document found.'});
				}else{
					loadedData = sentdata;
				}

			}
			let sendData = [];
			loadedData.find((o)=>{
				var date = o.date.split('.');
				var timestamp = new Date(date[2] + '.' + date[1] + '.' + date[0] + ' ' + o.time);
				if(fromTime <= timestamp && timestamp <= toTime)
					sendData.push(o);
			});
			var mysortfunction = (a, b) => {
			
				var o1 = a['date'].toLowerCase();
				var o2 = b['date'].toLowerCase();
			  
				var p1 = a['time'].toLowerCase();
				var p2 = b['time'].toLowerCase();
			  
				if (o1 < o2) return -1;
				if (o1 > o2) return 1;
				if (p1 < p2) return -1;
				if (p1 > p2) return 1;
				return 0;
			}
			sendData.sort(mysortfunction);
			res.header(200).json({
				status: 'success',
				data: (req.body.latest*1 == 1)? sendData.pop():sendData,
			});
	} finally {
			await client.close();
		}
	}
	run().catch(
		(err) => {
			// console.log("mongodb connect error ========");
			// res.header(400).json({status: 'failed', reason:'MongoDB connection Failed.'});
		}
	);	
});

module.exports = app;