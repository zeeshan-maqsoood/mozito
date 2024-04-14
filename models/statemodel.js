const mongoose = require("mongoose");

const stateSchema = new mongoose.Schema({
    name: {
        type: String,
        // unique: true,
        trim: true
    },
    country: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Country"
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    },
});

module.exports = mongoose.model("State", stateSchema);