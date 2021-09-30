var express = require('express');
var app = express();
const auth = require("../middleware/auth");
const User = require('../model/User');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require("config");
const Model = require('../model/Model');

app.get('/', function(req, res) {
	// render to views/index.ejs template file
	res.redirect('/viewer')
})

app.get('/viewer', auth, function(req, res) {
	// render to views/index.ejs template file
	res.render('pages/viewer', {
		title: '3D Viewer - Owl Studio Web App',
		priv: req.user.privilege,
		model_data: '',
	})
})

app.get('/data',auth, async function(req,res){
	let modelsdata = await Model.find();
	// console.log(modelsdata);
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
})

app.get('/login', function(req, res) {
	// render to views/index.ejs template file
	res.render('pages/login', {title: 'Login - Owl Studio Web App'})
})

app.get('/logout', function(req, res){
	req.session.destroy();
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
			res.redirect('/viewer');
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
		// 	res.redirect('/viewer');
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


/** 
 * We assign app object to module.exports
 * 
 * module.exports exposes the app object as a module
 * 
 * module.exports should be used to return the object 
 * when this file is required in another module like app.js
 */ 
module.exports = app;
