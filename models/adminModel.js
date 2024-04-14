const crypto = require("crypto")
const { model, Schema } = require("mongoose");
// const log4js = require("log4js");
// const logger = log4js.getLogger("userSchema");
// logger.level = "all"
const userSchema = new Schema({
    email: {
        type: String,
        // unique: true,
        trim: true,
    },
    username: {
        type: String,
        trim: true,
        default: ""
    },
    password: {
        type: String,
        trim: true
    },
    role: {
        type: Schema.Types.ObjectId,
        ref: "Role",
    },
    active: {
        type: Boolean,
        default: true
    },
    photo: {
        key: String,
        url: String
    },
    // ad: {
    //     type: Boolean,
    //     default: false
    // },
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
    block: {
        status: {
            type: Boolean,
            default: false
        },
        date: {
            type: Date
        },
        by: {
            type: Schema.Types.ObjectId,
            ref: "Admin"
        }
    },
    addedBy: {
        type: Schema.Types.ObjectId,
        ref: "Admin"
    },
    fcmToken: {
        type: String,
        default: ""
    }

},
    {
        timestamps: true
    }
);

// userSchema.methods.toJSON = function() {
//     const userobject = this.toObject()
//     delete userobject.password
//     return userobject
// }
userSchema.methods.genrateHash = async function (password) {
    return new Promise((resolve, reject) => {
        crypto.scrypt(password, "saltlasdfljiosdkjfhihsdkjhfr", 64, (err, derivedKey) => {
            if (err) reject(err);
            return resolve(derivedKey.toString('hex'))
        });
    })
}
userSchema.methods.comparePassword = async function (password) {
    return new Promise((resolve, reject) => {
        crypto.scrypt(password, "saltlasdfljiosdkjfhihsdkjhfr", 64, (err, derivedKey) => {
            if (err) reject(err);
            return resolve(this.password == derivedKey.toString('hex'))
        });
    })
}
userSchema.plugin(require('mongoose-delete'), { overrideMethods: "all", select: true, deletedAt: true, deletedBy: true })
// userSchema.index({ "geoLocation": "2dsphere" });
module.exports = model("Admin", userSchema);


