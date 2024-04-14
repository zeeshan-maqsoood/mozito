const {
  Panic,
  Pet,
  Breed,
  Species,
  Country,
  State,
  City,
  Panic_Reason,
  PanicReport,
  Notification
} = require("../models");
const { isValidId } = require("../validator");

const mongoose = require("mongoose");
const PetService = require("../service/pet");
const { getAgeString } = require("../utils");
const PanicService=require("../service/panic");
const {
  firebaseNotificationUser,
  firebaseNotificationMultiUser,
} = require("../common/firebaseNotificationHelper");
const notificationMessages = require("../common/notificationMessages");
const FriendService = require("../service/friends");
exports.createPanicAlert = async (req, res, next) => {
  try {
    const { body } = req;
    let pet;
    let panicNotification
    const newPanicBody = {
      ...Object.assign(req.body),
      ...Object.assign(req.body.pet || {}),
      other: true,
    };
    if (!req.files)
      return next({ status: 404, msg: "atlease one image is required" });
    const images = req.files.map((file) => {
      return {
        mimetype: file.mimetype,
        key: Math.ceil(Math.random() * 100001),
        url: file.location,
      };
    });
    newPanicBody.images = images;
    const { user } = req;
    newPanicBody.createdBy = user._id;
    if (body.petId && body.type !== "found") {
      pet = await PetService.getPet({ owner: user._id, _id: body.petId });
      if (!pet) return next({ status: 404, msg: "pet not found" });
      const owner = {
        name: user.name,
        email: user.email,
        contactNo: req.body.petOwner ? req.body.petOwner.contactNo : "",
      };
      const petinfo = {
        name: pet.name,
        age: getAgeString(pet.dob),
      };
      newPanicBody.pet = petinfo;
      newPanicBody.petOwner = owner;
      // newPanicBody.color = pet.color;
      newPanicBody.species = pet.species;
      newPanicBody.breed = pet.mix
        ? pet.mix
        : pet.breed === null
        ? ""
        : pet.breed.name;
      newPanicBody.country = user.country;
      newPanicBody.state = user.state;
      newPanicBody.city = user.city;
      newPanicBody.other = false;
    }
    if (body.breed && !body.petId) {
      if (mongoose.isValidObjectId(body.breed)) {
        const breed = await Breed.findOne({ _id: body.breed });
        if (breed) newPanicBody.breed = breed.name;
      } else {
        newPanicBody.breed = body.breed;
      }
    }

    if (body.type === "lost" && !req.body.petId) {
      const owner = {
        ...req.body.petOwner,
      };
      newPanicBody.petOwner = owner;
      panicNotification = "Lost Pet! Keep an eye & a tail out!"
    } else if (body.type === "found") {
      if (body.foundByMe === "true" || body.foundByMe === true) {
        newPanicBody.founder.name = req.user.name;
        newPanicBody.founder.email = req.user.email;
      }
      newPanicBody.typeNumber = 2;
      panicNotification = "Paw-some news! Pet found!"
    } else if (body.type === "emergency") {
      newPanicBody.typeNumber = 3;
      newPanicBody.engravedTag = "";
      panicNotification = "Help! We've got a pet-mergency!"
    }
    // newPanicBody.date=new Date(body.date)

    const panic = new Panic(newPanicBody);

    await panic.save();
    panic.petId = null;
    
    firebaseNotificationMultiUser(
      req.selected_pet,
      req,
      notificationMessages.panicTitle(req.selected_pet.name),
      // `Help ${req.selected_pet.name} to solve this Alert`,
      panicNotification,
      panic._id,
      "panic"
    );
    
    const normalizeFriend = await FriendService.getNormalizeFriend(
      mongoose.Types.ObjectId(req.selected_pet._id),
      "accepted"
    );
    await Pet.updateMany({_id:normalizeFriend},{$set:{
      panicAlert:true
    }});

    return res
      .status(200)
      .json({ success: true, data: { panic }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
};

exports.getPanicsForAdmin = async (req,res,next)=>{
  try {
    let perPage=Number(req.query.perPage||10)
    let pageNo=Number(req.query.pageNo||1)
    let filter={}
    if(req.query.type){
      const type=req.query.type.split(',')
      filter={$or:[{ type:type[0] },{ type:type[1] },{ type:type[2] },{ type:type[3] }]}
    }
    // const lostcounttype = type.indexOf("lost")
    // const foundcounttype = type.indexOf("found")
    // const emergencycounttype = type.indexOf("emergency")
    // const countpanics = await Panic.find({$or:[{type:type[0]},{type:type[1]},{type:type[2]}]}).countDocuments()
    const lostpets = await Panic.find({type:"lost"}).countDocuments()
    const foundpets = await Panic.find({type:"found"}).countDocuments()
    const emergencypets = await Panic.find({type:"emergency"}).countDocuments()
    const panics = await Panic.aggregate([
      {$lookup:{
        from:"pets",as:"petId",
        let:{petID:"$petId"},
        pipeline:[
          {$match:{$expr:{$eq:["$_id","$$petID"]}}},
          {$project:{photo:1,name:1}}
        ]
      }},
      {$lookup:{
        from:"countries",as:"country",
        let:{countryID:"$country"},
        pipeline:[
          {$match:{$expr:{$eq:["$_id","$$countryID"]}}},
          {$project:{name:1}}
        ]
      }},
      {$lookup:{
        from:"states",as:"state",
        let:{stateID:"$state"},
        pipeline:[
          {$match:{$expr:{$eq:["$_id","$$stateID"]}}},
          {$project:{name:1}}
        ]
      }},
      {$lookup:{
        from:"cities",as:"city",
        let:{cityID:"$city"},
        pipeline:[
          {$match:{$expr:{$eq:["$_id","$$cityID"]}}},
          {$project:{name:1}}
        ]
      }},
      {$lookup:{
        from:"species",as:"species",
        let:{speciesID:"$species"},
        pipeline:[
          {$match:{$expr:{$eq:["$_id","$$speciesID"]}}},
          {$project:{name:1}}
        ]
      }},
      {$lookup:{
        from:"users",as:"createdBy",
        let:{createdByID:"$createdBy"},
        pipeline:[
          {$match:{$expr:{$eq:["$_id","$$createdByID"]}}},
          {$project:{name:1}}
        ]
      }},
      {$lookup:{
        from:"panic_reasons",as:"reasonId",
        let:{reasonID:"$reasonId"},
        pipeline:[
          {$match:{$expr:{$eq:["$_id","$$reasonID"]}}},
          {$project:{text:1,type:1}}
        ]
      }},
      {$unwind:{path:"$petId",preserveNullAndEmptyArrays:true}},
      {$unwind:{path:"$country",preserveNullAndEmptyArrays:true}},
      {$unwind:{path:"$state",preserveNullAndEmptyArrays:true}},
      {$unwind:{path:"$city",preserveNullAndEmptyArrays:true}},
      {$unwind:{path:"$species",preserveNullAndEmptyArrays:true}},
      {$unwind:{path:"$createdBy",preserveNullAndEmptyArrays:true}},
      {$unwind:{path:"$reasonId",preserveNullAndEmptyArrays:true}},
      {$match:filter},
      {$skip:(pageNo-1)*perPage},
      {$limit:perPage},
      {$sort:{createdAt:-1}}
    ])
    return res.status(200).json({success:true,data:{emergencypets,lostpets,foundpets,panics},msg:"ok",status:200})
  } catch (error) {
    return next(error)
  }
}

exports.getSinglePanicForAdmin = async (req,res,next)=>{
  try {
    let filter={
      _id:mongoose.Types.ObjectId(req.params.id)
    }
    const singlePanic = await Panic.aggregate([
      {$match:filter},
      {$lookup:{
        from:"pets",as:"petId",
        let:{petID:"$petId"},
        pipeline:[
          {$match:{$expr:{$eq:["$_id","$$petID"]}}},
          {$project:{photo:1,name:1}}
        ]
      }},
      {$lookup:{
        from:"countries",as:"country",
        let:{countryID:"$country"},
        pipeline:[
          {$match:{$expr:{$eq:["$_id","$$countryID"]}}},
          {$project:{name:1}}
        ]
      }},
      {$lookup:{
        from:"states",as:"state",
        let:{stateID:"$state"},
        pipeline:[
          {$match:{$expr:{$eq:["$_id","$$stateID"]}}},
          {$project:{name:1}}
        ]
      }},
      {$lookup:{
        from:"cities",as:"city",
        let:{cityID:"$city"},
        pipeline:[
          {$match:{$expr:{$eq:["$_id","$$cityID"]}}},
          {$project:{name:1}}
        ]
      }},
      {$lookup:{
        from:"species",as:"species",
        let:{speciesID:"$species"},
        pipeline:[
          {$match:{$expr:{$eq:["$_id","$$speciesID"]}}},
          {$project:{name:1}}
        ]
      }},
      {$lookup:{
        from:"users",as:"createdBy",
        let:{createdByID:"$createdBy"},
        pipeline:[
          {$match:{$expr:{$eq:["$_id","$$createdByID"]}}},
          {$project:{name:1}}
        ]
      }},
      {$lookup:{
        from:"panic_reasons",as:"reasonId",
        let:{reasonID:"$reasonId"},
        pipeline:[
          {$match:{$expr:{$eq:["$_id","$$reasonID"]}}},
          {$project:{text:1,type:1}}
        ]
      }},
      {$unwind:{path:"$petId",preserveNullAndEmptyArrays:true}},
      {$unwind:{path:"$country",preserveNullAndEmptyArrays:true}},
      {$unwind:{path:"$state",preserveNullAndEmptyArrays:true}},
      {$unwind:{path:"$city",preserveNullAndEmptyArrays:true}},
      {$unwind:{path:"$species",preserveNullAndEmptyArrays:true}},
      {$unwind:{path:"$createdBy",preserveNullAndEmptyArrays:true}},
      {$unwind:{path:"$reasonId",preserveNullAndEmptyArrays:true}}
    ])
    if(singlePanic.length>0) return res.status(200).json({success:true,data:{ singlePanic },msg:"ok",status:200})
    else return res.status(200).json({success:true,data:{},msg:"This Panic has been deleted.",status:200})
  } catch (error) {
    return next(error)
  }
}

exports.deleteSinglePanicForAdmin = async (req,res,next)=>{
  try {
    let id = mongoose.Types.ObjectId(req.params.id)
    let panic = await Panic.findById({_id:id})
    let panicreport = await PanicReport.findOne({panicID:id})
    let mazitoPet = await Pet.findById({_id:"6156f131cff1a4b5e17a0460"})
    if (!panic) return next({ status: 404, msg: "Panic Not Found" });
    if (!panicreport) return next({ status: 404, msg: "Panic report not found" })
    let notification = new Notification({
      from:panicreport.from,
      to:panicreport.to,
      fromPet:mazitoPet._id,
      toPet:panicreport.toPet,
      title:"Delete By Admin",
      body:`Your ${panic.type}(${panic.detail}) Panic is wrong.`
    })
    await notification.save()
    await panic.delete()
    await panicreport.delete()
    return res.status(200).json({success:true,data:{},msg:"Panic deleted.",status:200})
  } catch (error) {
    return next(error)
  }
}

exports.getPanics = async (req, res, next) => {
  try {
    const perPage = Number(req.query.perPage || 10);
    const pageNo = Number(req.query.pageNo || 1);
    const type = req.query.type || "";
    const panics =await PanicService.getPanicForUsers(type,req.user._id,pageNo,perPage);
    return res.status(200).json({
      success: true,
      data: {
        // countpanics,
        panics
      },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getMyPanics = async (req, res, next) => {
  try {
    const match = {
      closed: false,
      createdBy: mongoose.Types.ObjectId(req.user._id),
    };
    if (req.query.other === "true" || req.query.other === true) {
      match.other = true;
    }
    if (req.query.other === "false" || req.query.other === false) {
      match.other = false;
    }
    const panics = await PanicService.getMyPanic(match);
    return res.status(200).json({
      success: true,
      data: {
        panics,
      },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getSinglePanic = async (req, res, next) => {
  try {
    const panic = await Panic.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(req.params.id),
        },
      },
      {
        $lookup: {
          from: "species",
          localField: "species",
          foreignField: "_id",
          as: "species",
        },
      },
      {
        $lookup: {
          from: "countries",
          localField: "country",
          foreignField: "_id",
          as: "country",
        },
      },
      {
        $unwind: {
          path: "$species",
          preserveNullAndEmptyArrays: true,
        },
      },
      // {
      //   $lookup: {
      //     from: "colors",
      //     localField: "color",
      //     foreignField: "_id",
      //     as: "color",
      //   },
      // },
      // {
      //   $unwind: {
      //     path: "$color",
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
      { $unwind: { path: "$country", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "states",
          localField: "state",
          foreignField: "_id",
          as: "state",
        },
      },
      { $unwind: { path: "$state", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "cities",
          localField: "city",
          foreignField: "_id",
          as: "city",
        },
      },
      { $unwind: { path: "$city", preserveNullAndEmptyArrays: true } },
      // {
      //   $lookup: {
      //     from: "colors",
      //     localField: "color",
      //     foreignField: "_id",
      //     as: "color",
      //   },
      // },
      // {
      //   $unwind: {
      //     path: "$color",
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
      {
        $project: {
          date: 1,
          country: {
            $cond: {
              if: "$country",
              then: "$country.name",
              else: "",
            },
          },
          detail: 1,
          age: { $ifNull: ["$pet.age", ""] },

          state: {
            $cond: { if: "$state", then: "$state.name", else: "" },
          },
          city: {
            $cond: { if: "$city", then: "$city.name", else: "" },
          },
          // color: {
          //   $cond: { if: "$color", then: "$color.name", else: "" },
          // },
          color: 1,
          pet: {
            name: 1,
          },
          petOwner: 1,
          founder: 1,
          contactNo: 1,
          date: 1,
          owner: 1,
          other: 1,
          type: 1,
          createdAt: 1,
          location: 1,
          images: 1,
          species: { $ifNull: ["$species.name", ""] },
          breed: { $ifNull: ["$breed", ""] },
          closed: 1,
        },
      },
    ]);
    if (!panic.length) return next({ status: 404, msg: "panic not found" });

    const perPage = Number(req.query.perPage || 4);
    const otherPanics = await Panic.aggregate()
      .match({
        closed: false,
        _id: { $nin: [mongoose.Types.ObjectId(req.params.id)] },
      })
      .lookup({
        from: "species",
        localField: "species",
        foreignField: "_id",
        as: "species",
      })
      .lookup({
        from: "countries",
        localField: "country",
        foreignField: "_id",
        as: "country",
        pipeline:[
          {$project:{
            name:1
          }}
        ]
      })
      .lookup({
        from: "states",
        localField: "state",
        foreignField: "_id",
        as: "state",
        pipeline:[
          {$project:{
            name:1
          }}
        ]
      })
      .lookup({
        from: "cities",
        localField: "city",
        foreignField: "_id",
        as: "city",
        pipeline:[
          {$project:{
            name:1
          }}
        ]
      })
      .unwind({
        path: "$species",
        preserveNullAndEmptyArrays: true,
      })

      // .lookup({
      //   from: "colors",
      //   localField: "color",
      //   foreignField: "_id",
      //   as: "color",
      // })
      // .unwind({
      //   path: "$color",
      //   preserveNullAndEmptyArrays: true,
      // })

      .unwind({
        path: "$country",
        preserveNullAndEmptyArrays: true,
      })
      .unwind({
        path: "$state",
        preserveNullAndEmptyArrays: true,
      })
      .unwind({
        path: "$city",
        preserveNullAndEmptyArrays: true,
      })
      .project({
        // country: {
        //   $cond: { if: "$color", then: "$color.name", else: "" },
        // },
        color: 1,
        detail: 1,
        age: { $ifNull: ["$pet.age", ""] },

        other: 1,
        type: 1,
        createdAt: 1,
        location: 1,
        images: 1,
        species: { $ifNull: ["$species.name", ""] },
        my: { $eq: ["$createdBy", mongoose.Types.ObjectId(req.user._id)] },
        breed: { $ifNull: ["$breed", ""] },
        country:1,
        state:1,
        city:1
      })
      .sort({
        createdAt: -1,
      })
      .limit(perPage || 4);

    return res.status(200).json({
      success: true,
      data: {
        panic: panic[0],
        otherPanics,
      },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.updatePanic = async (req, res, next) => {
  try {
    const { body } = req;
    let pet;
    const newPanicBody = {
      ...req.body,
      other: true,
    };
    let images;
    if (req.files.length) {
      images = req.files.map((file) => {
        return {
          mimetype: file.mimetype,
          key: Math.ceil(Math.random() * 100001),
          url: file.location,
        };
      });
      newPanicBody.images = images;
    }
    const { user } = req;
    newPanicBody.createdBy = user._id;
    if (body.petId && body.type !== "found") {
      pet = await PetService.getPet({ owner: user._id, _id: body.petId });
      if (!pet) return next({ status: 404, msg: "pet not found" });
      const owner = {
        name: user.name,
        email: user.email,
        contactNo: req.body.petOwner ? req.body.petOwner.contactNo : "",
      };
      const petinfo = {
        name: pet.name,
        age: getAgeString(pet.dob),
      };
      newPanicBody.pet = petinfo;
      newPanicBody.petOwner = owner;
      // newPanicBody.color = pet.color;
      newPanicBody.species = pet.species;
      newPanicBody.breed = pet.mix
        ? pet.mix
        : pet.breed === null
        ? ""
        : pet.breed.name;
      newPanicBody.country = user.country;
      newPanicBody.state = user.state;
      newPanicBody.city = user.city;
      newPanicBody.other = false;
    }
    if (body.breed && !body.petId) {
      const breed = await Breed.findById(body.breed);
      if (breed) newPanicBody.breed = breed.name;
    }

    if (body.type === "lost" && !req.body.petId) {
      const owner = {
        ...req.body.petOwner,
        contactNo: req.body.contactNo,
      };
      newPanicBody.petOwner = owner;
    } else if (body.type === "found") {
      newPanicBody.petOwner = {
        name: "",
        email: "",
        contactNo: "",
      };
      newPanicBody.typeNumber = 2;
    } else if (body.type === "emergency") {
      newPanicBody.founder = {
        name: "",
        email: "",
        contactNo: "",
      };
      newPanicBody.typeNumber = 3;
      newPanicBody.engravedTag = "";
    }
    // newPanicBody.date=new Date(body.date)
    const panic = await Panic.findByIdAndUpdate(
      { _id: req.params.id, createdBy: user._id },
      { $set: newPanicBody },
      { new: true }
    );
    if (!panic) return next({ status: 404, msg: "Panic not found" });
    panic.petId = null;
    return res
      .status(200)
      .json({ success: true, data: { panic }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
};

exports.closeAlertController = async (req, res, next) => {
  try {
    let reasonObj = {
      closed: true,
      closedReason: req.body.reason,
    };
    // let reason;
    // if (isValidId(req.body.reason)) {
    //   reason = await Panic_Reason.findById(req.body.reason);
    //   reasonObj.reasonId = req.body.reason;
    //   reasonObj.closedReason = reason.text;
    // }
    // if(!reason) return next({ status: 404, msg: "Reason not found" });
    // findOneAndUpdate
    const panic = await Panic.findById(
      {
        _id: req.params.id,
        createdBy: req.user._id,
      }
    );
    if (!panic) return next({ status: 404, msg: "You Cannot delete this panic" });
    // panic.reasonId=reason._id;
    panic.closedReason=req.body.reason;
    panic.closed=true;
    await panic.save();
    firebaseNotificationUser(
      req.selected_pet,
      req,
      "Pet Panic Resolved!",
      // `thanks God ${req.selected_pet.name} panic solved`,
      `Congratulations! We are happy that your pet problem was successfully fixed`,
      panic._id,
      "panicDetails"
    );

    return res.status(200).json({
      success: true,
      data: {
        msg: "Alert Closed",
      },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getAlert = async (req, res, next) => {
  try {
    // console.log("req.selected_pet", req.selected_pet);
    // const mypetId = mongoose.Types.ObjectId(req.selected_pet._id);
    // const normalizeOwnerIds = await FriendService.getOwnerIds(
    //   mypetId,
    //   "accepted"
    // );
    // const alert = await Panic.findOne({
    //   createdBy: normalizeOwnerIds,
    //   closed: false,
    // });
    const alert=req.selected_pet ? req.selected_pet.panicAlert:false
    return res.status(200).json({
      success: true,
      data: {
        alert: alert
      },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.alertDismiss = async (req, res, next) => {
  try {
    const mypetId = mongoose.Types.ObjectId(req.selected_pet._id);
    await Pet.findOneAndUpdate({ _id: mypetId }, { panicAlert: false });
    return res.status(200).json({
      success: true,
      data: {
        msg:"Alert Dismissed"
      },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};
