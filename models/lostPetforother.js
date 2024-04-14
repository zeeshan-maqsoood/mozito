const mongoose = require("mongoose");
const lostPet = new mongoose.Schema({
    other: {
        type: Boolean,
        default: true,
    },
    name: {
        type: String
    },
    age: {
        type: Date
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
        type: Date,
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
    owner: {
        name: {
            type: String
        },
        contactNo: {
            type: String
        },
        email: {
            type: String
        },
        detail: {
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
    other: {
        type: Boolean,
        default: true
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
    stage: {
        type: Number,
        default: 0
    }
    // tz: {
    //     type: String,
    //     default: "America/New_York"
    // }
}, {
    timestamps: true
});
// lostPet.index({ "geoLocation": "2dsphere" });
lostPet.plugin(require('mongoose-delete'), { overrideMethods: "all", deletedAt: true });

module.exports = mongoose.model("LostpetOther", lostPet);