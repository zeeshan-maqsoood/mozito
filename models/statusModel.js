const { Schema,model } = require("mongoose")

const statusSchema = new Schema(
    {
        mediaList:[
            {
                url:{
                    type:String,
                    require:true
                },
                isVideo:{
                    type:Boolean,
                    default:false
                },
                statusOffDate:{
                    type:Date,
                    require:true
                }
            }
        ],
        watched:{
            type:Boolean,
            default:false
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        pet: {
            type: Schema.Types.ObjectId,
            ref: "Pet",
        }
    },
    {
        timestamps: true
    }
)
statusSchema.plugin(require('mongoose-delete'),{
    overrideMethods: 'all',
    deletedAt: true
})

module.exports = model("status",statusSchema)