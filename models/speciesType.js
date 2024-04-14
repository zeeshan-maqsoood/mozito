var mongoose = require("mongoose");

var { Schema } = mongoose;

var speciesType = new Schema({
    name: {
        type: String,
        default: "",
        trim: true
    },
    species: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Species",
        required: true
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        required: true
    }
});

speciesType.plugin(require('mongoose-delete'), { overrideMethods: "all", select: true, deletedAt: true, deletedBy: true })
module.exports = mongoose.model("SpeciesType", speciesType)