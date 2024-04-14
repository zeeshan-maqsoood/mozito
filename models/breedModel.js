var mongoose = require("mongoose");

var { Schema } = mongoose;

var breedSchema = new Schema({
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
    speciesType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SpeciesType"
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        required: true
    }
});

breedSchema.plugin(require('mongoose-delete'), { overrideMethods: "all", select: true, deletedAt: true, deletedBy: true })
module.exports = mongoose.model("Breed", breedSchema)