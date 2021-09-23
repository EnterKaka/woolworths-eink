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

app.get('/', function(req, res) {
	// render to views/index.ejs template file
	res.render('welcome', {title: 'Owl Studio Web App'})
})

app.get('/dashboard', auth, function(req, res) {
	// render to views/index.ejs template file
	res.render('pages/index', {title: 'DashBoard - Owl Studio Web App'})
})

app.get('/charts', auth, function(req, res) {
	// render to views/index.ejs template file
	res.render('pages/charts', {title: 'Owl Studio Web App'})
})

app.get('/members', auth, function(req, res) {
	// render to views/index.ejs template file
	res.render('pages/members', {title: 'Owl Studio Web App'})
})

app.get('/login', function(req, res) {
	// render to views/index.ejs template file
	res.render('pages/login', {title: 'Owl Studio Web App'})
})

app.get('/logout', function(req, res){
	req.session.destroy();
	return res.redirect('/');
})

app.post('/login', async function(req, res) {
	const querySchema = Joi.object({
		username: Joi.string().required(),
		password: Joi.string().required()
	})
	// const validator = createValidator();
	// console.log('validation', validator.query(querySchema));
	const { error } = querySchema.validate(req.body);
	console.log('error', error);
	if(error) {
		return res.redirect('/login');
	}
	let user1 = await User.findOne({ username: req.body.username });
	let token = jwt.sign({...user1}, config.get("myprivatekey"));
	// const token = "token"
	// res.send(token);
	req.session.accessToken = token;
	await req.session.save();
	res.redirect('/dashboard');
	// res.redirect('/dashboard');
});

app.get('/signup', function(req, res) {
	// render to views/index.ejs template file
	res.render('pages/signup', {title: 'Owl Studio Web App'})
});

app.post('/signup', async function(req, res) {
	// const { error } = validate(req.body);
	const querySchema = Joi.object({
		name: Joi.string().required(),
		email: Joi.string().email(),
		username: Joi.string(),
		password: Joi.string().required(),
		"remember-me": Joi.string(),
    	repeat_password: Joi.ref('password'),
	})
	// const validator = createValidator();
	// console.log('validation', validator.query(querySchema));
	const { error } = querySchema.validate(req.body);
	console.log(error);
	if (error) return res.redirect('/signup');
  
	//find an existing user
	let user = await User.findOne({ email: req.body.email });
	let user1 = await User.findOne({ username: req.body.username });
	if (user || user1) return res.status(400).send("User already registered.");
	
	user = new User({
	  fullName: req.body.name,
	  username: req.body.username,
	  password: req.body.password,
	  email: req.body.email
	});
	user.password = await bcrypt.hash(user.password, 10);
	await user.save();
  
	// const token = user.generateAuthToken();
	res.redirect('/login');
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
