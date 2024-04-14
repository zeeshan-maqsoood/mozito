const { Schema, model } = require("mongoose");
const petReportSchema = new Schema({
    from: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    to: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    fromPet: {
        type: Schema.Types.ObjectId,
        ref: "Pet"
    },
    toPet: {
        type: Schema.Types.ObjectId,
        ref: "Pet"
    },
    report: {
        type: String,
        default: "Description not available"
    },
    // petID: {
    //     type: Schema.Types.ObjectId
    // }
}, {
    timestamps: true
});

module.exports = model("petReport", petReportSchema);
