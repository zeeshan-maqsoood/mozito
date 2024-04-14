var mongoose = require("mongoose");

var { Schema } = mongoose;

var colorSchema = new Schema({
    name: {
        type: String,
        default: "",
        trim: true
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        required: true
    }
});


module.exports = mongoose.model("Color", colorSchema)