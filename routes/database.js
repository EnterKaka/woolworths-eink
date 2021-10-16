var express = require('express');
var app = express();
const auth = require("../middleware/auth");
const User = require('../model/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require("config");
const MongoClient = require("mongodb").MongoClient;


app.get('/export', auth, function(req, res) {

	res.render('pages/export', {
		title: 'Export page - Owl Studio Web App',
	})

});


module.exports = app;
