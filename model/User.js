var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
	name: String,
	email: String,
	pass: String,
	privilege: String,
});

module.exports = mongoose.model('users', UserSchema);