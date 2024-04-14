const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");
const petSchema = mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
    },
    dob: {
      type: Date,
    },
    adaptionDate: {
      type: Date,
    },
    about: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      default: "",
    },
    photo: {
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
    breed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Breed",
    },
    species: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Species",
    },
    speciesType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SpeciesType",
    },
    isMixedBreed: {
      type: Boolean,
      default: false,
    },
    mix: {
      type: String,
      default: "pure",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    color: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Color",
    },
    status: {
      type: String,
    },
    petBlock: [
      {
        pet: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Pet",
        },
        date: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    interest: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Interest",
      },
    ],
    isdummy: {
      type: Boolean,
      default: false,
    },
    stage: {
      type: Number,
      default: 0,
      // stage=1 then pet half profile is complete and half is left.
      // stage=2 then pet profile is completed.
    },
    panicAlert: {
      type: Boolean,
      default: false,
    },
    nosuggetions:[{
      type:mongoose.Schema.Types.ObjectId,
      // default:""
    }],
  },
  { timestamps: true }
);

// petSchema.index({ "geoLocation": "2dsphere" });
// petSchema.plugin(require('mongoose-delete'), { select: true, overrideMethods: "all", deletedAt: true })
petSchema.plugin(mongoose_delete, {
  deletedAt: true,
  deletedBy: true,
  overrideMethods: "all",
});
module.exports = mongoose.model("Pet", petSchema);
