const { Schema, model } = require("mongoose");
const notificationSchema = new Schema({
    from: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    to: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    fromPet: {
        type: Schema.Types.ObjectId,
        ref: "Pet"
    },
    toPet: {
        type: Schema.Types.ObjectId,
        ref: "Pet"
    },
    title: {
        type: String,
        default: ""
    },
    body: {
        type: String,
        default: "Description not available"
    },
    total: {
        type: Number,
        default: 1
    },
    read: {
        type: Boolean,
        default: false
    },
    // type: {
    //     type: String,
    //     default: ""
    // },
    screenName:{
        type:String,
        default:""
    },
    screenId: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});
notificationSchema.plugin(require('mongoose-delete'), { overrideMethods: "all", deletedAt: true })
module.exports = model("Notification", notificationSchema);
