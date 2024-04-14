const mongoose = require("mongoose");


const MealSchema = new mongoose.Schema({
    pet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pet"
    },
    time: {
        type: Date
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
},
    {
        timestamps: true
    }
);
MealSchema.plugin(require('mongoose-delete'), { overrideMethods: "all", deletedAt: true });
module.exports = mongoose.model("Play", MealSchema);