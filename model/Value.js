var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ValueSchema = new Schema({
    name: Schema.Types.String,
    value: Schema.Types.String,
});

module.exports = mongoose.model("value", ValueSchema);
