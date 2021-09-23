var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
	name: String,
	email: String,
    username: String,
	password: String
});

module.exports = mongoose.model('users', UserSchema);