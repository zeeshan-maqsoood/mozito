
const mongoose = require("mongoose")

const versionSchema = new mongoose.Schema({
    description: {
        type: String,
        default: ""
    },
    name: {
        type: String,
        default: ""
    },
    buildId: {
        type: String,
        default: ""
    },
    versionNo: {
        type: String,
        default: ""
    },
},
    {
        timestamps: true,
    });
module.exports = mongoose.model("Version", versionSchema)