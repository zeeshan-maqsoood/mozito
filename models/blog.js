var mongoose = require("mongoose");
var { Schema } = mongoose;

var blogSchema = new Schema({
    title: {
        type: String,
        default: "",
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    },
    body: {
        type: String,
    },
    active: {
        type: Boolean,
        default: true
    },
    viewsCount: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }],
    helpful: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    unhelpful: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    photo: {
        key: {
            type: String,
            default: ""
        },
        url: {
            type: String,
            default: ""
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    },
}, {
    timestamps: true
});

blogSchema.plugin(require('mongoose-delete'), { overrideMethods: "all", select: true, deletedAt: true, deletedBy: true })
module.exports = mongoose.model("Blog", blogSchema)