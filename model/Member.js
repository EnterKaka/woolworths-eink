var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MemberSchema = new Schema({
	name: String,
	email: String,
    username: String,
	password: String,
	privilege: String
});

module.exports = mongoose.model('members', MemberSchema);