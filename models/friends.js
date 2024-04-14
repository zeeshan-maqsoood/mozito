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
    status: {
        type: String,
        default: "pending",
        enum:["pending","rejected","accepted","canceled","unfriend","blocked"]
    }
}, {
    timestamps: true
});
// paringSchema.index({ "geoLocation": "2dsphere" });

module.exports = model("Friends", paringSchema);