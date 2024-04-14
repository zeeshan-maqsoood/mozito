const mongoose = require("mongoose");


const faqSchema = new mongoose.Schema({
    question: {
        type: String
    },
    answer: {
        type: String
    },
    active: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    }
}, { timestamps: true });

faqSchema.plugin(require('mongoose-delete'), { overrideMethods: "all", deletedAt: true });
module.exports = mongoose.model("Faq", faqSchema);