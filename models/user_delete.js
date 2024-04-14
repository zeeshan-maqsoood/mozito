
const { model, Schema } = require("mongoose");
const log4js = require("log4js");
const crypto = require("crypto")
const logger = log4js.getLogger("userDelete");
logger.level = "all"
const userDelete = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    admin: {
        type: Schema.Types.ObjectId,
        ref: "Admin"
    },
    delete_by:{
        // 1=> Admin
        // 2 => User
        type:Number,
        enum:[1,2]
    },
    reason:{
        type:String,
        default:""
    },
    from:{
        type:Date,
        default:Date.now()
    },
    status:{
        // true => account suspension closed [mean user can use there account]  
        // false => user unale to close there account
        type:Boolean,
        default:false,
    },
    to:{
        type:Date,
    },
    delete_type:{
        // 1 => temprary [suspend]
        // 2 => permanent [delete]
        type:Number,
        enum:[1,2]
    },
    restore_by:{
        // 1=> Admin
        // 2 => User
        type:Number,
        enum:[1,2]
    },
    restore_admin:{
        type: Schema.Types.ObjectId,
        ref: "Admin"
    }

},
    { timestamps: true }
);
module.exports = model("User_delete", userDelete);


