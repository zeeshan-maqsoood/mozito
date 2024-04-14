const { Schema, model } = require("mongoose");
const PostSchema = new Schema(
  {
    description: {
      type: String,
    },
    content: {
      // if mediaType photo then media will be photo
      // if mediaType video then media will video
      // mediaType must be within ["photo","video"]
      mimetype: {
        type: String,
        default: "",
      },
      isVideo: {
        type: Boolean,
        default: false,
      },
      thumbnail_image: {
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
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    },
    contetList: [
      {
        // if mediaType photo then media will be photo
        // if mediaType video then media will video
        // mediaType must be within ["photo","video"]
        mimetype: {
          type: String,
          default: "",
        },
        isVideo: {
          type: Boolean,
          default: false,
        },
        thumbnail_image: {
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
          },
          updatedAt: {
            type: Date,
            default: Date.now,
          },
        },
      },
    ],
    // may be used in future
    // geoLocation: {
    //     type: {
    //         type: String,
    //         default: "Point"
    //     },
    //     coordinates: {
    //         type: [Number],
    //         default: [0.00, 0.00]
    //     }
    // },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    // used for storing maps
    // may be used in future
    // location: {
    //     url: {
    //         type: String,
    //         default: ""
    //     },
    //     isUrl: {
    //         type: Boolean,
    //         default: false
    //     }
    // },
    pet: {
      type: Schema.Types.ObjectId,
      ref: "Pet",
    },
    // comments: {
    //   type: Schema.Types.ObjectId,
    //   ref: "Comments"
    // },
    likes: [
      {
        pet: {
          type: Schema.Types.ObjectId,
          ref: "Pet",
        },
        date: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    shares: [
      {
        pet: {
          type: Schema.Types.ObjectId,
          ref: "Pet",
        },
        date: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    views: [
      {
        pet: {
          type: Schema.Types.ObjectId,
          ref: "Pet",
        },
        date: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    recommend: {
      type: Boolean,
      default: false,
    },
    public: {
      type: Boolean,
      default: false,
    },
    // endTime: {
    //   type: Date,
    //   default: Date.now() + 24 * 60 * 60 * 1000,
    // },
    active: {
      type: Boolean,
      default: true,
    },
    hidePost:[
      {
        hideBy:{
          type: Schema.Types.ObjectId,
          ref: "Pet"
        },
        hide:{
          type:Boolean
        }
      }
    ],
    block:{
      type:Boolean,
      default:false
    }

    // hidePostAdmin:[
    //   {
    //     hideBy:{
    //       type: Schema.Types.ObjectId,
    //       ref: "Admin"
    //     },
    //     hide:{
    //       type:Boolean
    //     }
    //   }
    // ]
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
module.exports = model("Post", PostSchema);
