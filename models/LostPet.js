const mongoose = require("mongoose");
const lostPet = new mongoose.Schema({
    other: {
        type: Boolean,
        default: false,
    },
    pet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pet"
    },
    breed: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Breed"

    },
    species: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Species"
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
    lastSeen: {
        type: Date
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

lostPet.plugin(require('mongoose-delete'), { overrideMethods: "all", deletedAt: true });

// lostPet.index({ "geoLocation": "2dsphere" });
module.exports = mongoose.model("Lostpet", lostPet);