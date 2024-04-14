const { Schema,model } = require("mongoose")

const userPageSchema = new Schema(
    {
        title:{
            type:String,
            require:true
        },
        coverPhoto:{
            type:String,
            default:""
        },
        photo:{
            type:String,
            require:true
        },
        about:{
            type:String,
            require:true
        },
        website:{
            type:String,
            default:""
        },
        category:{
            type:String,
            default:""
        },
        contactNo:{
            type:String,
            default:""
        },
        userPage: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        likedBy:{
            type:Array,
            default:[]
        },
    },
    {
        timestamps: true
    }
)
userPageSchema.plugin(require('mongoose-delete'),{
    overrideMethods: 'all',
    deletedAt: true
})

module.exports = model("Userpage",userPageSchema)