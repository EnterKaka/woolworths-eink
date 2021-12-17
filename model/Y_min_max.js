var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var Y_min_maxSchema = new Schema({
    name: Schema.Types.String,
    option: Schema.Types.String,
    min: Schema.Types.String,
    max: Schema.Types.String,
});

module.exports = mongoose.model("y_min_max", Y_min_maxSchema);
