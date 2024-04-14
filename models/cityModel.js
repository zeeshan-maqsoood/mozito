const mongoose = require("mongoose");
const citySchema = new mongoose.Schema({
    name: {
        type: String,
        // required: true,
        default: ""
    },
    state: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "State",
        // autopopulate: true
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    }
});
// citySchema.index({name:"text"})
module.exports = mongoose.model("City", citySchema);