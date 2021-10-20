var express = require('express');
var app = express();
const auth = require("../middleware/auth");
const MongoClient = require("mongodb").MongoClient;
var ObjectId = require('mongoose').Types.ObjectId;
const fs = require('fs');
const Setting = require('../model/Setting');
var http = require('http');
var converter = require('json-2-csv');
const fileUpload = require('express-fileupload');
app.use(fileUpload());
/* export page */

app.get('/export', auth, function(req, res) {

	console.log("*********** load export page ************")

	if(loadedData === '')
		res.redirect('/data');
	res.render('pages/export', {
		title: 'Export page - Owl Studio Web App',
		loadedData: loadedData
	})
});

app.post('/exportdb', auth, function(req, res) {
	console.log("************ make file *************");
	async function run() {
		try {
			/* link mongoDB */
			const client = await new MongoClient('mongodb://localhost:27017/', { useUnifiedTopology: true });

			let models = req.body.models, type = req.body.type, file = req.body.file;
			let result = [];
			let modelname = '';
			/* find models by model name */
			for(let model of models){
				loadedData.filter((obj)=>{
					if(obj.name === model)
						result.push(obj);
				});
				modelname = model;
			}
			if(models.length > 1) modelname = 'total';
			let settingid = [];

			/* get db settings that included models */
			result.filter(function(volume){ 
				if(settingid.indexOf(volume.setid) === -1){
					settingid.push(volume.setid);
				}
			});
			await client.connect();
			let totaldata = [];
			/* export data */
			for(let element of settingid){
				let setobj = await Setting.findOne({_id: new ObjectId(element) });
				/* get db name and collection name */
				const database = client.db(setobj.dbname);
				const datas = database.collection(setobj.collectionname);
				for(let model of models){
					const cursor = await datas.find({"measurement.name": model}).toArray();
					if(cursor.length === 0) continue;
					cursor.forEach(obj => {
						totaldata.push(obj);
					});
				}
			}
			if(file === 'csv'){
				var json2csvCallback = async function (err, csv) {
					if (err) throw err;
					await fs.writeFileSync('download/' + modelname + '.csv', csv);
					// await res.send(csv);
					// console.log(csv);
				};
				var option = {
					// delimiter : {
					// 	wrap  : '\'', // Double Quote (") character
					// 	field : ';', // Comma field delimiter
					// 	array : ',', // Semicolon array value delimiter
					// 	eol   : '\n' // Newline delimiter
					// },
					keys : ['_id','datetime','measurement.date','measurement.mass','measurement.name','measurement.pointcloud.x','measurement.pointcloud.y','measurement.pointcloud.z','measurement.remark','measurement.time','measurement.volume','modifeod','name'],
					// prependHeader    : true,
					// sortHeader       : false,
					// trimHeaderValues : true,
					// trimFieldValues  :  true,
				}
				converter.json2csv(totaldata, json2csvCallback,option);
				}
			else
				await fs.writeFileSync('download/'+modelname + '.json', JSON.stringify(totaldata),'utf8');
			client.close();
				res.render('pages/export', {
				title: 'Export page - Owl Studio Web App',
				loadedData: loadedData
			})
		} 
		finally {
		}
	}
	run().catch(
		(err) => {
			console.error(err)
			req.flash('error', err)
			res.render('pages/export', {
				title: 'Model DB - Owl Studio Web App',
				loadedData:loadedData,
				data: [],
			});
		}
	);

});
app.get('/exportdb', auth, function(req, res){
	console.log("************ download *************");
	res.download(__dirname+'/../download/' + req.query.name, req.query.name);
});

/* import page */

app.get('/import', auth, function(req, res) {

	console.log("*********** load export page ************")

	res.render('pages/import', {
		title: 'Import page - Owl Studio Web App',
	})
});

app.post('/upload', auth, function(req, res) {

	console.log("*********** upload page ************")

	console.log(req.files)
	if (req.files) {
        const file = req.files.file;
		console.log(file);
        const fileName = file.name;
		console.log(fileName);
        file.mv(`${__dirname}/../upload/${fileName}`, err => {
            if (err) {
                console.log(err);
                res.status(400).send('There is error');
            } else {
                res.send('uploaded successfully');
            }
        })
    } else {
        res.status(400).send('There are no files');
    }
});

app.post('/importdb', auth, async function(req, res) {

	console.log("************ import file *************");
	
	console.log(req.body);
	async function run() {
		const client = await new MongoClient('mongodb://localhost:27017/', { useUnifiedTopology: true });
		try {
			await client.connect();
			let errorMsg = 'Import Successfully';
			/* get db name and collection name */
			const database = await client.db(req.body.dbname);
			if(req.body.filename.split('.')[1] === 'json'){
				console.log('json*************************')
				let data = await fs.readFileSync(__dirname + '/../upload/' + req.body.filename);
				const docs = JSON.parse(data.toString());
				let docs_arr = [];
				docs.forEach(model=>{
					let doc = {...model};
					if(typeof model._id === 'object'){
						doc._id = model._id['$oid'];
					}
					doc._id = new ObjectId(doc._id);
					docs_arr.push(doc);
				});
				await database.collection(req.body.collectionname).insertMany(docs_arr, function(err, result){
					if (err) errorMsg = 'Import failed';
					console.log('Inserted docs:', docs.length);
				});
			}else{
				console.log('csv**********************')
				await csvtojson().fromFile(__dirname + '/../upload/' + req.body.filename).then(async jsonobj=>{
					await database.collection(req.body.collectionname).insertMany(jsonobj, function(err, result){
						if (err) errorMsg = 'Import failed';
						console.log('Inserted docs:', jsonobj.length);
					});
				});
			}
			res.send(errorMsg);

		} 
		finally {
			// res.render('pages/import', {
			// 	title: 'Export page - Owl Studio Web App',
			// 	errorMessage:'Import Failed'
			// });
		}
	}
	run().catch(
		(err) => {
			console.error(err)
			req.flash('error', err)
			res.render('pages/import', {
				title: 'Model DB - Owl Studio Web App',
				errorMessage:'Import Failed'
			});
		}
	);

});

module.exports = app;
