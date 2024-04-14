const { Schema, model } = require("mongoose");

const albumSchema = new Schema(
  {
    mimetype: {
      type: String,
      default: "",
    },
    media: {
      key: {
        type: String,
        default: "",
      },
      url: {
        type: String,
        default: "",
      }
    },
    isVideo:{
      type:Boolean,
      default:false
    },
    thumbnail_image: {
      type: String,
      default: "",
    },
    pet: {
      type: Schema.Types.ObjectId,
      ref: "Pet",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
        // geoLocation: {
    //   type: {
    //     type: String,
    //     default: "Point",
    //   },
    //   coordinates: {
    //     type: [Number],
    //     default: [0.0, 0.0],
    //   },
    // },
  },
  {
    timestamps: true,
  }
);

albumSchema.plugin(require("mongoose-delete"), {
  overrideMethods: "all",
  deletedAt: true,
});
// albumSchema.index({ "geoLocation": "2dsphere" });
module.exports = model("Media", albumSchema);
