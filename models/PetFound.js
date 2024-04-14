const mongoose = require("mongoose");
const petfound = new mongoose.Schema({
    breed: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Breed"
    },
    species: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Species"
    },
    date: {
        type: Date,
        default: Date.now
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
    location: {
        type: String,
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
    founder: {
        name: {
            type: String,
            required: true
        },
        contactNo: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        description: {
            type: String,
            default: ""
        }
    },
    color: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Color"
    },
    solve: {
        by: mongoose.Schema.Types.Mixed,
        isSolve: {
            type: Boolean,
            default: false
        },
        reason: String,
    },
    tag: {
        type: String,
        default: ""
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    isdummy: {
        type: Boolean,
        default: false
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
// petfound.index({ "geoLocation": "2dsphere" });
petfound.plugin(require('mongoose-delete'), { overrideMethods: "all", deletedAt: true });

module.exports = mongoose.model("Petfound", petfound);