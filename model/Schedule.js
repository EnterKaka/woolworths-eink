var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ScheduleSchema = new Schema({
    day: Schema.Types.String,
    interval_value: Schema.Types.String,
    unit: Schema.Types.String,
    start_time: Schema.Types.String,
    end_time: Schema.Types.String,
});

module.exports = mongoose.model("schedule", ScheduleSchema);
