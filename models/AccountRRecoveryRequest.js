
const { model, Schema } = require("mongoose");
const log4js = require("log4js");
const logger = log4js.getLogger("passwordRecoveryRequest");
logger.level = "all"
const passwordRecoveryRequest = new Schema({
    email: {
        type: String,
        required: true
    },
    // secondaryEmail: {
    //     type: String
    // },
    name: {
        type: String,
        required: true
    },
    // dob: {
    //     type: String,
    //     required: true
    // },
    country: {
        type: Schema.Types.ObjectId,
        ref: "Country"
    },
    state: {
        type: Schema.Types.ObjectId,
        ref: "State"
    },
    city: {
        type: Schema.Types.ObjectId,
        ref: "City"
    },
    solve: {
        type: Boolean,
        default: false
    },
    userId:{
        type: Schema.Types.ObjectId,
        ref: "User"
    }
},
    { timestamps: true }
);

passwordRecoveryRequest.plugin(require('mongoose-delete'), { overrideMethods: "all", select: true, deletedAt: true, deletedBy: true })
module.exports = model("AccountRecovery", passwordRecoveryRequest);


