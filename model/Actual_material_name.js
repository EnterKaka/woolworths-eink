var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var MaterialSchema = new Schema({
    model_name: Schema.Types.String,
    material_name: Schema.Types.String,
});

module.exports = mongoose.model("actual_material_name", MaterialSchema);
