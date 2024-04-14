const mongoose = require("mongoose");
const emergencyAlert = new mongoose.Schema({
    // pet: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Pet"
    // },
    species: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Species"
    },
    breed: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Breed"
    },
    photo: {
        key: {
            type: String,
            default: ""
        },
        url: {
            type: String,
            default: ""
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    },
    country: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Country"
    },
    state: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "State"
    },
    city: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "City"
    },
    location: {
        type: String
    },
    age: {
        type: Date
    },
    contactNo: {
        type: String
    },
    detail: {
        type: String,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    email: {
        type: String
    },
    // color: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Color"
    // },
    tag: {
        type: String,
    },
    solve: {
        by: mongoose.Schema.Types.Mixed,
        isSolve: {
            type: Boolean,
            default: false
        },
        reason: String,
    },
    addedBy: {
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
    },
}, {
    timestamps: true
});


// emergencyAlert.index({ "geoLocation": "2dsphere" });
emergencyAlert.plugin(require('mongoose-delete'), { overrideMethods: "all", deletedAt: true });

module.exports = mongoose.model("Emergencyalert", emergencyAlert);