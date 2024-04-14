const { Schema, model } = require("mongoose");
const PostSchema = new Schema(
  {
    body: {
      type: String,
      default:""
    },
    // pet:{
    //   type: Schema.Types.ObjectId,
    //   ref: "Pet",
    // },
    author: {
      type: Schema.Types.ObjectId,
      ref: "Pet",
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: "Pet",
    }],
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "Comments",
    },
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comments",
      },
    ],
    // date: {
    //   type: Date,
    //   default: Date.now(),
    // },
    level:{
      type:String,
      default:"1",
      enum:["1","2"]
    }
  },
  {
    timestamps: true,
  }
);
// PostSchema.index({ "geoLocation": "2dsphere" });
PostSchema.plugin(require("mongoose-delete"), {
  overrideMethods: "all",
  deletedAt: true,
});
module.exports = model("Comments", PostSchema);
