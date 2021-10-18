var express = require('express');
var app = express();
const auth = require("../middleware/auth");
const User = require('../model/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require("config");
const MongoClient = require("mongodb").MongoClient;
const { object } = require('joi');


app.get('/export', auth, function(req, res) {
	// if(loadedData === '')
	// 	res.redirect('/data');
	res.render('pages/export', {
		title: 'Export page - Owl Studio Web App',
		loadedData: loadedData
	})
});

app.post('/exportdb', auth, function(req, res) {
	let models = req.body.models, type = req.body.type, file = req.body.file;
	let result = [];
	for(let model of models){
		loadedData.filter((obj)=>{
			if(obj.name === model)
				result.push(obj);
		});
	}
	result = [
		  {
			_id: '6164789b142200003a000b06',
			date: '12.10.2021',
			time: '02:47:06',
			name: 'blablabla_ground',
			mass: 0,
			volume: 7.299601078033447,
			setid: '615ca5f16db0eade08fc6de8'
		  },
		  {
			_id: '6169775ce13f0000180070bd',
			date: '15.10.2021',
			time: '14:43:08',
			name: 'Borhspat',
			mass: 511.9866638183594,
			volume: 170.66221618652344,
			setid: '6166dda320ab6a7368d021ea'
		  },
		  {
			_id: '616976b2e13f00001800708b',
			date: '15.10.2021',
			time: '14:40:17',
			name: 'Borhspat',
			mass: 512.51806640625,
			volume: 170.83935546875,
			setid: '6166dda320ab6a7368d021ea'
		  },
		  {
			_id: '616975ede13f000018007059',
			date: '15.10.2021',
			time: '14:37:01',
			name: 'Borhspat',
			mass: 505.2047424316406,
			volume: 168.40158081054688,
			setid: '6166dda320ab6a7368d021ea'
		  },
		  {
			_id: '6169743ae13f000018007024',
			date: '15.10.2021',
			time: '14:29:45',
			name: 'Borhspat',
			mass: 511.5616149902344,
			volume: 170.52053833007812,
			setid: '6166dda320ab6a7368d021ea'
		  },
		  {
			_id: '61697317e13f000018006ff4',
			date: '15.10.2021',
			time: '14:24:55',
			name: 'Borhspat',
			mass: 492.8695983886719,
			volume: 164.28985595703125,
			setid: '6166dda320ab6a7368d021ea'
		  },
		  {
			_id: '616971bf4b3400006a0057e7',
			date: '15.10.2021',
			time: '14:19:11',
			name: 'Borhspat',
			mass: 511.5113830566406,
			volume: 170.5037841796875,
			setid: '6166dda320ab6a7368d021ea'
		  },
		  {
			_id: '61696d094b3400006a0057b5',
			date: '15.10.2021',
			time: '13:59:05',
			name: 'Borhspat',
			mass: 503.1424255371094,
			volume: 167.71414184570312,
			setid: '6166dda320ab6a7368d021ea'
		  },
		  {
			_id: '6169685b4b3400006a005783',
			date: '15.10.2021',
			time: '13:39:06',
			name: 'Borhspat',
			mass: 508.8956298828125,
			volume: 169.6318817138672,
			setid: '6166dda320ab6a7368d021ea'
		  },
		  {
			_id: '616963a84b3400006a005751',
			date: '15.10.2021',
			time: '13:19:04',
			name: 'Borhspat',
			mass: 514.4164428710938,
			volume: 171.47213745117188,
			setid: '6166dda320ab6a7368d021ea'
		  },
		  {
			_id: '61695f034b3400006a0056a5',
			date: '15.10.2021',
			time: '12:59:15',
			name: 'Borhspat',
			mass: 513.3041381835938,
			volume: 171.1013946533203,
			setid: '6166dda320ab6a7368d021ea'
		  },
		  {
			_id: '61695bb04b3400006a005673',
			date: '15.10.2021',
			time: '12:45:04',
			name: 'Borhspat',
			mass: 511.91448974609375,
			volume: 170.63815307617188,
			setid: '6166dda320ab6a7368d021ea'
		  },
		  {
			_id: '61695a494b3400006a005641',
			date: '15.10.2021',
			time: '12:39:05',
			name: 'Borhspat',
			mass: 509.2815856933594,
			volume: 169.76052856445312,
			setid: '6166dda320ab6a7368d021ea'
		  },
		  {
			_id: '616955984b3400006a00560f',
			date: '15.10.2021',
			time: '12:19:04',
			name: 'Borhspat',
			mass: 514.4915161132812,
			volume: 171.49717712402344,
			setid: '6166dda320ab6a7368d021ea'
		  },
		  {
			_id: '6169543c4b3400006a0055dd',
			date: '15.10.2021',
			time: '12:13:16',
			name: 'Borhspat',
			mass: 495.9162292480469,
			volume: 165.30540466308594,
			setid: '6166dda320ab6a7368d021ea'
		  },
		  {
			_id: '616950ec4b3400006a005593',
			date: '15.10.2021',
			time: '11:59:07',
			name: 'Borhspat',
			mass: 508.2196350097656,
			volume: 169.4065399169922,
			setid: '6166dda320ab6a7368d021ea'
		  },
		  {
			_id: '61694f08cd0900004000160a',
			date: '15.10.2021',
			time: '11:51:03',
			name: 'Borhspat',
			mass: 510.6504211425781,
			volume: 170.21681213378906,
			setid: '6166dda320ab6a7368d021ea'
		  },
		  {
			_id: '61694d47cd090000400015d8',
			date: '15.10.2021',
			time: '11:43:34',
			name: 'Borhspat',
			mass: 507.2160949707031,
			volume: 169.07203674316406,
			setid: '6166dda320ab6a7368d021ea'
		  },
		  {
			_id: '61694b68cd090000400015a6',
			date: '15.10.2021',
			time: '11:35:36',
			name: 'Borhspat',
			mass: 489.9007873535156,
			volume: 163.30026245117188,
			setid: '6166dda320ab6a7368d021ea'
		  },
		  {
			_id: '61694a69cd09000040001574',
			date: '15.10.2021',
			time: '11:31:21',
			name: 'Borhspat',
			mass: 491.3125305175781,
			volume: 163.77084350585938,
			setid: '6166dda320ab6a7368d021ea'
		  }
	  ];
	let settingid = [];
	result.filter(function(volume){ 
		if(settingid.indexOf(volume.setid) === -1){
			settingid.push(volume.setid);
		}
	});
	console.log(settingid,'1242135423542345');

	if(loadedData === '')
		res.redirect('/data');
	res.render('pages/export', {
		title: 'Export page - Owl Studio Web App',
		loadedData: loadedData
	})
});


module.exports = app;
