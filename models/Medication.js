const mongoose = require("mongoose");


const Medication = new mongoose.Schema({
    pet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pet"
    },
    medicationType: {
        type: String,
    },
    time: {
        type: Date,
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
    },
    geoLocation: {
        type: {
            type: String,
            default: "Point"
        },
        coordinates: {
            type: [Number],
            default: [0.00, 0.00]
        }
    }
}, {
    timestamps: true
});

// Medication.index({ "geoLocation": "2dsphere" });

module.exports = mongoose.model("Medication", Medication); 