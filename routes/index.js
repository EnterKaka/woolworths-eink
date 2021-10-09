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
	// render to views/index.ejs template file
	console.log('/dashboard----------');
	if(req.session.dbname)
		console.log(req.session.dbname, req.session.collectionname);
	else{
		req.session.dbname = 'OwlEyeStudioWebInterface';
		req.session.collectionname = 'models';
	}

	//This is all models that seperated with name.
	var allmodels = [];
	var allnames = [];
	const client = new MongoClient('mongodb://localhost:27017/', { useUnifiedTopology: true });
	async function run() {
		try {
			await client.connect();
			const database = client.db(req.session.dbname);
			const datas = database.collection(req.session.collectionname);
			// query for movies that have a runtime less than 15 minutes
			const cursor = datas.find({});
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
					let modelname = model.measurement[0].name;
					let eachmodeldata = {
						_id: model._id,
						datetime: model.datetime,
						mass: model.measurement[0].mass,
						volume: model.measurement[0].volume,
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
					
				});
				//sucess
				res.render('pages/dashboard', {
					title: 'Dashboard - Owl Studio Web App',
					data: allmodels,
					names: allnames,
					dbname: req.session.dbname,
					collectionname: req.session.collectionname,
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
		var email = req.body.email.trim();
		var pass = req.body.pass.trim();
		if((email == 'admin@oe-web.com' ) && (pass == 'admin1234' )){
			let v_user = new User({
				name: 'Quirin Kraus',
				pass: 'admin1234',
				email: 'admin@oe-web.com',
				privilege: 'admin',
			});
			v_user.pass = await bcrypt.hash(v_user.pass, 10);
			await v_user.save();
			let user1 = await User.findOne({ email: req.body.email });
			let token = jwt.sign({...user1}, config.get("myprivatekey"));
			req.session.accessToken = token;
			await req.session.save();
			res.redirect('/');
		}
		for (const key in req.body) {
			if (Object.hasOwnProperty.call(req.body, key)) {
				req.flash(key, req.body[key])
			}
		}
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
