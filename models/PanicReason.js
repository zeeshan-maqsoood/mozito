const mongoose = require("mongoose");

const PanicReasonSchema = new mongoose.Schema({
    text: {
        type: String,
        default: ""
    },
    type:{
        type:String,
        enum: ["lost", "found", "emergency"]
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    }
}, {
    timestamps: true
});

PanicReasonSchema.plugin(require('mongoose-delete'), { overrideMethods: "all", select: true, deletedAt: true, deletedBy: true })

module.exports = mongoose.model("Panic_Reason", PanicReasonSchema);