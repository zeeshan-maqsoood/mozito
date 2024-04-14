const { Schema, model } = require("mongoose");
const messageSchema = new Schema({
    chat: {
        type: Schema.Types.ObjectId,
        ref: "Chat"
    },
    from: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    to: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    body: {
        type: String
    },
    hidefrom: {
        type: String,
        default: "none"
    }
},
    {
        timestamps: true
    }
);

module.exports = model("Message", messageSchema);