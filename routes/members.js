var express = require('express')
var app = express()
var ObjectId = require('mongodb').ObjectId
const Member = require('../model/Member');
const Joi = require('joi');
const { createValidator } = require('express-joi-validation');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// SHOW LIST OF USERS
app.get('/', async function(req, res, next) {	
	// fetch and sort users collection by id in descending order
    // console.log('eooeooo');
    
	let allmembers = await Member.find();
	// console.log(allmembers);
	res.render('pages/members/list', {
		data : allmembers,	
	})
});

// SHOW ADD USER FORM
app.get('/add', function(req, res, next){	
	// render to views/pages/members/add.ejs
	res.render('pages/members/add', {
		title: 'Add New User',
		username: '',
		email: '',
		password: ''		
	})
});

// ADD NEW USER POST ACTION
app.post('/add',async function(req, res, next){	
    // console.log(req);

	// const querySchema = Joi.object({
	// 	name: Joi.string().required(),
	// 	email: Joi.string().email(),
	// 	username: Joi.string(),
	// 	password: Joi.string().required(),
	// 	privilege: Joi.string().required()
	// })
	// // const validator = createValidator();
	// // console.log('validation', validator.query(querySchema));
	// const { error } = querySchema.validate(req.body);
	// console.log(error);
	// if (error) return res.redirect('/members');
  
	//find an existing user
	let user = await Member.findOne({ email: req.body.email });
	let user1 = await Member.findOne({ username: req.body.username });
	if (user || user1) return res.status(400).send("User already registered.");
	
	let memberone = new Member({
	  fullName: req.body.name,
	  username: req.body.username,
	  password: req.body.password,
	  email: req.body.email,
	  privilege: req.body.privilege,
	});
	memberone.password = await bcrypt.hash(memberone.password, 10);
	await memberone.save();
  
	// const token = user.generateAuthToken();
	res.redirect('/members');

	// req.assert('name', 'FullName is required').notEmpty()             //Validate age
	// req.assert('username', 'Name is required').notEmpty()           //Validate name
	// req.assert('password', 'Password is required').notEmpty()             //Validate age
    // req.assert('email', 'A valid email is required').isEmail()  //Validate email
    // req.assert('privilege', 'A valid Privilege is required').notEmpty()  //Validate email

    // var errors = req.validationErrors()
    
    // if( !errors ) {   //No errors were found.  Passed Validation!
		
	// 	/********************************************
	// 	 * Express-validator module
		 
	// 	req.body.comment = 'a <span>comment</span>';
	// 	req.body.username = '   a user    ';

	// 	req.sanitize('comment').escape(); // returns 'a &lt;span&gt;comment&lt;/span&gt;'
	// 	req.sanitize('username').trim(); // returns 'a user'
	// 	********************************************/
	// 	var user = {
	// 		username: req.sanitize('username').escape().trim(),
	// 		email: req.sanitize('email').escape().trim(),
	// 		password: req.sanitize('password').escape().trim()
	// 	}
				 
	// 	req.db.collection('members').insert(user, function(err, result) {
	// 		if (err) {
	// 			req.flash('error', err)
				
	// 			// render to views/pages/members/add.ejs
	// 			res.render('pages/members/edit', {
	// 				title: 'Add New User',
	// 				username: user.username,
	// 				email: user.email,
	// 				password: user.password					
	// 			})
	// 		} else {				
	// 			req.flash('success', 'Data added successfully!')
				
	// 			// redirect to user list page				
	// 			res.redirect('/members')
				
	// 			// render to views/pages/members/add.ejs
	// 			/*res.render('pages/members/add', {
	// 				title: 'Add New User',
	// 				name: '',
	// 				age: '',
	// 				email: ''					
	// 			})*/
	// 		}
	// 	})		
	// }
	// else {   //Display errors to user
	// 	var error_msg = ''
	// 	errors.forEach(function(error) {
	// 		error_msg += error.msg + '<br>'
	// 	})				
	// 	req.flash('error', error_msg)		
		
	// 	/**
	// 	 * Using req.body.name 
	// 	 * because req.param('name') is deprecated
	// 	 */ 
    //     res.render('pages/members/edit', { 
    //         title: 'Add New User',
    //         username: req.body.username,
    //         email: req.body.email,
    //         password: req.body.password
    //     })
    // }
})

// SHOW EDIT USER FORM
app.get('/edit/(:usernames)', async function(req, res, next){
	// var o_username = new ObjectId(req.params.usernames)
	console.log(req.params.usernames);
	let mem = await Member.findOne({ username: req.params.usernames});
	console.log(mem);

	res.render('pages/members/edit',{
		username: mem.username,
		name: mem.name,
		email: mem.email,
		password: mem.password,
		privilege: mem.privilege,
	})
	
})

// EDIT USER POST ACTION
app.put('/edit/(:usernames)', async function(req, res, next) {
	const filter = { username: req.params.usernames };
	const update = { name: req.body.name,
		username: req.body.username,
		password: req.body.password,
		email: req.body.email,
		privilege: req.body.privilege,
	};

	let mem = await Member.findOneAndUpdate(filter, update);
	res.redirect('/members');
})

// DELETE USER
app.delete('/delete/(:usernames)', function(req, res, next) {	
	var o_id = new ObjectId(req.params.usernames )
	req.db.collection('members').remove({"usernames": o_id}, function(err, result) {
		if (err) {
			req.flash('error', err)
			// redirect to users list page
			res.redirect('/members')
		} else {
			req.flash('success', 'User deleted successfully! name = ' + req.params.usernames)
			// redirect to users list page
			res.redirect('/members')
		}
	})	
})

module.exports = app
