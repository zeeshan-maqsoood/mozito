const mongoose = require("mongoose");

const interestModel = new mongoose.Schema({
    name: {
        type: String,
        default: ""
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Interest", interestModel);