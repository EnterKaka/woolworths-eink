var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ModelSchema = new Schema({
	datetime: String,
	measurement: [],
	modifeod: String,
	name: String,
});

module.exports = mongoose.model('models', ModelSchema);