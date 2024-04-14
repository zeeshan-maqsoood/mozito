const { reject } = require("lodash");
const { Schema, model } = require("mongoose");

const paringSchema = new Schema({
    to: {
        type: Schema.Types.ObjectId,
        ref: "Pet"
    },
    from: {
        type: Schema.Types.ObjectId,
        ref: "Pet"
    },
    description: {
        type: String,
        default:""
    },
    // geoLocation: {
    //     type: {
    //         type: String,
    //         default: "Point"
    //     },
    //     coordinates: {
    //         type: [Number],
    //         default: [0.00, 0.00]
    //     }
    // },
    active:{
        type:Boolean,
        default:true,
    },
    paringStatus: {
        type: String,
        default: "pending",
        enum:["pending","rejected","accepted","canceled","unpaired"]
    }
}, {
    timestamps: true
});
// paringSchema.index({ "geoLocation": "2dsphere" });

module.exports = model("Pairing", paringSchema);