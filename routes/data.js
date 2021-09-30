var express = require('express');
var app = express();
const Model = require('../model/Model');

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
		data: sentdata,
	})
});

app.get('/view/(:datetime)', async function(req, res, next) {
	let model = await Model.findOne({datetime: req.params.datetime})
	var pcl = model.measurement[0].pointcloud;
	console.log('point cloud ========================');
	req.flash("pointcloud", JSON.stringify(pcl));
	res.redirect('/viewer');
})
module.exports = app;