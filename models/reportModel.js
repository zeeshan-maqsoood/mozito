const mongoose = require("mongoose");
const reportSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    reason: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Reason"
    },
    about: {
        type: String,
        default: ""
    },
    solvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
module.exports = mongoose.model("Report", reportSchema);