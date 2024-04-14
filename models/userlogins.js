const { model, Schema } = require("mongoose");

const loginsSchema= new Schema({
    user:{
        type:Schema.Types.ObjectId,
        ref:"users"
    },
    // login_device: {
    //     type: String,
    //     default: "Android",
    //     // enum: ["Android", "iOS", ""]
    // },
    tokens:[{
        token:{
            type:String,
            default:""
        }
    }],
},{
    timestamps:true
});

module.exports = model("userlogin", loginsSchema);