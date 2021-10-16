var express = require('express');
var app = express();
const auth = require("../middleware/auth");
const User = require('../model/User');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require("config");
const MongoClient = require("mongodb").MongoClient;


app.get('/', function(req, res) {
	// render to views/index.ejs template file
	res.redirect('/dashboard')
})

app.get('/viewer', auth, function(req, res) {
	// render to views/index.ejs template file
	
	res.render('pages/viewer', {
		title: '3D Viewer - Owl Studio Web App',
		priv: req.user.privilege,
		model_data: '',
	})
})

app.get('/dashboard', auth, function(req, res) {

	console.log('********* load dashboard page ************');

	//This is all models that seperated with name.
	var allmodels = [];
	var allnames = [];
	
	async function run() {
		try {
				// replace console.dir with your callback to access individual elements
				var lastmodelname;//for current item for update
				for(const model of  loadedData){
					let modelname = model.name;
					let eachmodeldata = {
						_id: model._id,
						datetime: model.date + ' ' + model.time,
						mass: model.mass,
						volume: model.volume,
					}
					let stored = false;
					for(const element of allmodels){
						if(element.name === modelname){
							element.log.push(eachmodeldata);
							stored = true;
							break;
						}
					}
					
					if(stored == false){
						let temp_model = {
							name: modelname,
							log: [],
						}
						temp_model.log.push(eachmodeldata);
						allmodels.push(temp_model);
						allnames.push(modelname);
					}
					lastmodelname = modelname;//for name sort by current datetime
				}
				allmodels = makeSortedDatasbytime(lastmodelname, allmodels);
				// //sucess
				if(loadedData !== ''){
					res.render('pages/dashboard', {
						title: 'Dashboard - Owl Studio Web App',
						data: allmodels,
						loadedData: loadedData,
						names: allnames,
					});
				}
				else{
					res.redirect('/data/');
				}
		} finally {
		}
	}
	run().catch(
		(err) => {
			console.log("mongodb connect error ========");
			console.error(err)
		   	req.flash('error', err)
		   	// redirect to users list page
		   	res.render('pages/dashboard', {
				title: 'Model DB - Owl Studio Web App',
			});
		}
	);

	
})

app.get('/login', function(req, res) {
	// render to views/index.ejs template file
	res.render('pages/login', {title: 'Login - Owl Studio Web App'})
})

app.get('/logout', function(req, res){
	req.session.destroy();
	loadedData = '';
	return res.redirect('/');
})

app.post('/login', async function(req, res) {
	const querySchema = Joi.object({
		email: Joi.string().required(),
		pass: Joi.string().required()
	})
	const { error } = querySchema.validate(req.body);
	if(error) {
		return res.redirect('/login');
	}
	let user1 = await User.findOne({ email: req.body.email });
	let token = jwt.sign({...user1}, config.get("myprivatekey"));
	if(user1) {
		if(bcrypt.compareSync(req.body.pass, user1.pass)) {
			req.session.accessToken = token;
			await req.session.save();
			res.redirect('/');
		}
		else{
			for (const key in req.body) {
				if (Object.hasOwnProperty.call(req.body, key)) {
					req.flash(key, req.body[key])
				}
			}
			req.flash('error', 'Password is incorrect.');
			res.render('pages/login', {title: '3D Viewer - Owl Studio Web App'});
		}
	}else{
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
		req.flash('error', 'Email is not registered');
		res.render('pages/login', {title: '3D Viewer - Owl Studio Web App'});
	}
});

function makeSortedDatasbytime(lastmodelname, allmodels){
	var sorteddata = allmodels, tmp_data,i = 0;
	for(const element of allmodels){
		if(element.name === lastmodelname){
			tmp_data = sorteddata.slice(i, i+1);
			sorteddata.splice(i,1);
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
