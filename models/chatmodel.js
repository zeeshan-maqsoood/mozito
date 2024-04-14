const { Schema, model } = require("mongoose");
const messageSchema = new Schema(
    {
        pets: [{
            type: Schema.Types.ObjectId,
            ref: "Pet"
        }],
        notify: {
            type: Schema.Types.ObjectId,
            ref: "Pet"
        },
        hidefrom: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);
module.exports = model("Chat", messageSchema);
