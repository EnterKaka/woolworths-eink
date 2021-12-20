var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
	name: {type: String, default: 'admin'},
	email: {type: String, default: 'admin@owleyesystem.com'},
	pass: {type: String, default: 'OwlEyeAdmin'},
	privilege: {type: String, default: 'admin'},
});

module.exports = mongoose.model('users', UserSchema);