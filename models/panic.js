const { model, Schema } = require("mongoose");
const PanicSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["lost", "found", "emergency"],
    },
    // i think below field is not required-
    // typeNumber: {
    //   type: Number,
    //   enum: [1, 2, 3], // 1=> lost, 2=> found, 3=> emergency
    // },
    petId: {
      // only required in lostmy and emergency my
      // And required if panic is for my
      type: Schema.Types.ObjectId,
      ref: "Pet",
    },
    date: {
      // lost => date work as lastseen,
      //  found=> date work as founddate,
      // emergency=> date is nothing or may be emergency date
      type: Date,
    },
    images: [
      {
        key: {
          type: String,
          default: "",
        },
        url: {
          type: String,
          default: "",
        },
        mimetype: {
          type: String,
        },
      },
    ],
    country: {
      type: Schema.Types.ObjectId,
      ref: "Country",
    },
    state: {
      type: Schema.Types.ObjectId,
      ref: "State",
    },
    city: {
      type: Schema.Types.ObjectId,
      ref: "City",
    },
    location: {
      type: String,
      default: "",
      // required in lost (my and other)
    },
    // contactNo: {
    //   // lostpet => contactNo
    //   // found => founder contact
    //   // emergency => no need
    //   type: String,
    // },
    detail: {
      type: String,
      default: "",
      // lost (my)
    },
    color: {
      // type: Schema.Types.ObjectId,
      // ref: "Color",
      type:String,
      default: "",
    },
    species: {
      type: Schema.Types.ObjectId,
      ref: "Species",
    },
    breed: {
      // type: Schema.Types.ObjectId,
      // ref: "Breed"
      type: String,
    },
    // mix:{
    //   type:Boolean,
    //   default:false
    // },
    petOwner: {
      // get owner info from createdBy if not name and email
      name: {
        type: String,
        default: "",
      },
      email: {
        type: String,
        default: "",
      },
      contactNo: {
        type: String,
        // default:""
      },
    },
    foundByMe:{
      type: Boolean,
      default: false,
    },
    founder: {
      name: {
        type: String,
        default: "",
      },
      email: {
        type: String,
        default: "",
      },
      contactNo: {
        type: String,
        // default:""
      },
    },
    issue: {
      type: String,
    },
    engravedTag: {
      type: String,
      default: "",
    },
    other: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    hidePanic:[
      {
        hideBy:{
          type: Schema.Types.ObjectId,
          ref: "User"
        },
        hide:{
          type:Boolean
        }
      }
    ],
    pet: {
      // if panic is for my then get pet info from petId.
      name: {
        type: String,
        default:""
      },
      age: {
        type: String,
        default: "",
      },
      
    },
    closed: {
      type: Boolean,
      default: false,
    },
    reasonId:{
      type:Schema.Types.ObjectId,
      ref:"panic_reasons"
    },
    closedReason: {
      type: String
    },
    // expireAt:{
    //   type: Date,
    //   // default: Date.now()
    // }
  },
  { timestamps: true }
);

PanicSchema.plugin(require("mongoose-delete"), {
  overrideMethods: "all",
  deletedAt: true,
});

// PanicSchema.index({"expireAt":1},{expireAfterSeconds:10})

module.exports = model("Panic", PanicSchema);
