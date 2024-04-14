
const { model, Schema } = require("mongoose");

const guestuserSchema = new Schema({
    email: {
        type: String,
        required: true,
        lowercase:true,
        trim: true,
    },
    name: {
        type: String,
        required:true,
        trim: true
    },
    visitDate: {
        type: Date,
        default: Date.now
    },
    online: {
        type: Boolean
    }
},
    { timestamps: true }
)

guestuserSchema.plugin(require('mongoose-delete'), { overrideMethods: "all", deletedAt: true })

module.exports = model("Guest_user", guestuserSchema);