const { model, Schema } = require("mongoose");

const guestUserLoginSchema= new Schema({
    guestuser:{
        type:Schema.Types.ObjectId,
        ref:"guest_users"
    },
    tokens:[{
        token:{
            type:String,
            default:""
        }
    }],
},{
    timestamps:true
});

module.exports = model("guestuserlogin", guestUserLoginSchema);