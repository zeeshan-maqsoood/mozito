var mongoose = require("mongoose");

var { Schema } = mongoose;

var categorySchema = new Schema({
    name: {
        type: String,
        default: "",
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        required: true
    }
});

module.exports = mongoose.model("Category", categorySchema)