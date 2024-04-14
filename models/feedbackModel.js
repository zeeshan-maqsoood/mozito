const mongoose = require("mongoose");

const feedBackSchema = new mongoose.Schema({
    title: {
        type: String
    },
    body: {
        type: String
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Feedback", feedBackSchema);