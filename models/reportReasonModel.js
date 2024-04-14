const mongoose = require("mongoose");
const reportSchema = new mongoose.Schema({
    name: {
        type: String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Reason", reportSchema);