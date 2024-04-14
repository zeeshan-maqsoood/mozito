
const { model, Schema } = require("mongoose");
const log4js = require("log4js");
const crypto = require("crypto")
const logger = log4js.getLogger("userSchema");
logger.level = "all"
const userSchema = new Schema({
    email: {
        type: String,
        // unique: [true, "email already in use"],
        required: true,
        lowercase:true,
        trim: true,
    },
    secondaryEmail: {
        type: String,
        default:"",
        lowercase:true,
        trim: true,
        // unique: [true, "email already in use"],
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        trim: true,
        default: ""
    },
    // dob: {
    //     type: Date
    // },
    country: {
        type: Schema.Types.ObjectId,
        ref: "Country",
        // autopopulate: true
    },
    state: {
        type: Schema.Types.ObjectId,
        ref: "State",
        // autopopulate: true
    },
    city: {
        type: Schema.Types.ObjectId,
        ref: "City",
        // autopopulate: true
    },
    // block: Schema.Types.Mixed,
    
    // may be removed 
    // resetPassword: {
    //     password: {
    //         type: String,
    //         default: ""
    //     },
    //     validUpto: {
    //         type: Date
    //     }
    // },
    isVerified: {
        type: Boolean,
        default: false
    },
    verifiedAt:{
        type:Date
    },
    isdummy: {
        type: Boolean,
        default: false
    },
    about: {
        type: String,
        trim: true,
        default: ""
    },
    // photo: {
    //     key: {
    //         type: String,
    //         default: ""
    //     },
    //     url: {
    //         type: String,
    //         default: ""
    //     },
    //     updatedAt: {
    //         type: Date,
    //         default: Date.now
    //     }
    // },
    isBlocked: {
        type: Boolean,
        default: false
    },
    blockBy: {
        type: Schema.Types.ObjectId,
        ref: "Admin"
    },
    unblockBy: {
        type: Schema.Types.ObjectId,
        ref: "Admin"
    },
    online: {
        type: Boolean,
        default: false
    },
    selected_pet: {
        type: Schema.Types.ObjectId,
        ref: "Pet"
    },
    // may be used in future
    // geoLocation: {
    //     type: {
    //         type: String,
    //         default: "Point"
    //     },
    //     coordinates: {
    //         type: [Number],
    //         default: [0.00, 0.00]
    //     }
    // },
    
    current_device: {
        type: String,
        default: "",
        // enum: ["Android", "iOS", ""]
    },
    signup_device: {
        type: String,
        default: "",
        // enum: ["Android", "iOS", ""]
    },
    totalLogins: {
        type: Number,
        default: 1
    },
    lastLoginDate: {
        type: Date,
        default: Date.now
    },
    isComplete: {
        type: Boolean,
        default: false
    },
    // may be used in future
    fcmToken: {
        type: String,
        default: ""
    }
},
    { timestamps: true }
);
// change secret key for all below

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

userSchema.methods.resetPasswordCompare = async function (password) {
    return new Promise((resolve, reject) => {
        crypto.scrypt(password, "saltlasdfljiosdkjfhihsdkjhfr", 64, (err, derivedKey) => {
            if (err) reject(err);
            return resolve(this.resetPassword.password == derivedKey.toString('hex'))
        });
    })
}

// please not remove below line 
// note: if you remove below then it will produce undefined error 
userSchema.plugin(require('mongoose-delete'), { overrideMethods: "all", deletedAt: true })
// userSchema.index({ "geoLocation": "2dsphere" });
module.exports = model("User", userSchema);


