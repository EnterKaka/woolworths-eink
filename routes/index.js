var express = require('express')
var app = express()

app.get('/', function(req, res) {
	// render to views/index.ejs template file
	res.render('pages/index', {title: 'Owl Studio Web App'})
})

app.get('/dashboard', function(req, res) {
	// render to views/index.ejs template file
	res.render('pages/index', {title: 'DashBoard - Owl Studio Web App'})
})

app.get('/charts', function(req, res) {
	// render to views/index.ejs template file
	res.render('pages/charts', {title: 'Owl Studio Web App'})
})

app.get('/3dviewer', function(req, res) {
	// render to views/index.ejs template file
	res.render('pages/owl3dviewer', {title: 'Owl Studio Web App'})
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
