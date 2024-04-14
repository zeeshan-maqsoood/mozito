const mongoose = require("mongoose");

const stateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        // unique: true
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    },
});

module.exports = mongoose.model("Country", stateSchema);