const mongoose = require("mongoose");

const MealSchema = new mongoose.Schema({
    pet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pet"
    },
    time: {
        type: Date
    },
    type: {
        type: String,
    },
    alert: {
        type: String
    },
    days: {
        type: [String],
    },
    description: {
        type: String
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true
});
MealSchema.plugin(require('mongoose-delete'), { select: true, overrideMethods: "all", deletedAt: true })
module.exports = mongoose.model("Meal", MealSchema); 