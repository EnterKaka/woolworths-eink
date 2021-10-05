var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SettingSchema = new Schema({
	dbname: Schema.Types.String,
	collectionname: Schema.Types.String
});

module.exports = mongoose.model('settings', SettingSchema);