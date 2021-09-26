var express = require('express');
var passport = require('passport');
var app = express();
var router = express.Router();
const auth = require("../middleware/auth");
const User = require('../model/User');
const Joi = require('joi');
const { createValidator } = require('express-joi-validation');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require("config");

// SHOW LIST OF USERS
app.get('/', auth, async function(req, res, next) {	
	// fetch and sort users collection by id in descending order
    
	let allmembers = await User.find();
	res.render('pages/user/list', {
		data : allmembers,	
	})
});

// SHOW ADD USER FORM
app.get('/add', auth ,function(req, res, next){	
	// render to views/pages/members/add.ejs
	res.render('pages/user/add', {
		title: 'Add New User - Owl Studio',
		name:'',
		email: '',
		password: '',
		privilege:'Guest'		
	})
});

// ADD NEW USER POST ACTION
app.post('/add', auth ,async function(req, res, next){	
	const querySchema = Joi.object({
		name: Joi.string().required(),
		email: Joi.string().email(),
		pass: Joi.string().required(),
		privilege: Joi.string().required()
	})
	// const validator = createValidator();
	// console.log('validation', validator.query(querySchema));
	const { error } = querySchema.validate(req.body);
	// console.log(error);
	// if (error) return res.redirect('/members');
	if(error) {
		req.flash('error', error);
		res.render('/user/add');
	}
	
	//find an existing user
	let mail = await User.findOne({ email: req.body.email });
	if (mail)
	{
		return res.status(400).send("User already registered.");
	} 
	
	let v_user = new User({
	  name: req.body.name,
	  pass: req.body.pass,
	  email: req.body.email,
	  privilege: req.body.privilege,
	});
	v_user.pass = await bcrypt.hash(v_user.pass, 10);
	await v_user.save();
  
	// const token = user.generateAuthToken();
	res.redirect('/user');
})


// SHOW EDIT USER FORM
app.get('/edit/(:usernames)', auth, async function(req, res, next){
	// var o_username = new ObjectId(req.params.usernames)
	console.log(req.params.usernames);
	let mem = await Member.findOne({ username: req.params.usernames});
	console.log(mem);

	res.render('pages/user/edit',{
		name: mem.name,
		email: mem.email,
		password: mem.password,
		privilege: mem.privilege,
	})
	
})

// EDIT USER POST ACTION
app.post('/edit/(:usernames)', auth, async function(req, res, next) {
	const filter = { username: req.params.usernames };
	const update = { name: req.body.name,
		password: req.body.password,
		email: req.body.email,
		privilege: req.body.privilege,
	};

	let mem = await Member.findOneAndUpdate(filter, update);
	res.redirect('/user');
})

// DELETE USER
app.delete('/delete/(:usernames)', auth, function(req, res, next) {	
	var o_id = new ObjectId(req.params.usernames )
	req.db.collection('members').remove({"usernames": o_id}, function(err, result) {
		if (err) {
			req.flash('error', err)
			// redirect to users list page
			res.redirect('/user')
		} else {
			req.flash('success', 'User deleted successfully! name = ' + req.params.usernames)
			// redirect to users list page
			res.redirect('/user')
		}
	})	
})



/** 
 * We assign app object to module.exports
 * 
 * module.exports exposes the app object as a module
 * 
 * module.exports should be used to return the object 
 * when this file is required in another module like app.js
 */ 
module.exports = app;
