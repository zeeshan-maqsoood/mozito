var mongoose = require("mongoose");
var { Schema } = mongoose;
var speciousSchema = new Schema({
    name: {
        type: String,
        default: "",
        trim: true
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        required: true
    },
    hasType:{
        type:Boolean,
        default: false,
    }
}, {
    timestamps: true
});
speciousSchema.plugin(require('mongoose-delete'), { overrideMethods: "all", select: true, deletedAt: true, deletedBy: true })
module.exports = mongoose.model("Species", speciousSchema);