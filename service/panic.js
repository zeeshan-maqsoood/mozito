const { Panic } = require("../models");
const mongoose = require("mongoose");
class PanicService {
  constructor() {}
  static getPanicForUsers = (type="",userId,pageNo=0,perPage=10) => {
    console.log("userId => ",userId)
    return Panic.aggregate()
    .match({
      closed: false,
      ...(type && { type }),
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
        {$project:{name:1}}
      ]
    })
    .lookup({
      from: "states",
      localField: "state",
      foreignField: "_id",
      as: "state",
      pipeline:[
        {$project:{name:1}}
      ]
    })
    .lookup({
      from: "cities",
      localField: "city",
      foreignField: "_id",
      as: "city",
      pipeline:[
        {$project:{name:1}}
      ]
    })
    .lookup({
      from: "pets",
      localField: "petId",
      foreignField: "_id",
      as: "petfromId",
    })
    .unwind({
      path: "$petfromId",
      preserveNullAndEmptyArrays: true,
    })
    .unwind({
      path: "$species",
      preserveNullAndEmptyArrays: true,
    })
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
    .match({
      "petfromId.deleted":{
        $ne:true
      }
    })
    .project({
      // country: {
      //   $cond: { if: "$country", then: "$country.name", else: "" },
      // },
      // color: {
      //   $cond: { if: "$color", then: "$color.name", else: "" },
      // },
      // petfromId:1,
      color: 1,
      detail: 1,
      age: { $ifNull: ["$pet.age", ""] },
      date: 1,
      other: 1,
      type: 1,
      createdAt: 1,
      petOwner: 1,
      founder: 1,
      location: 1,
      images: 1,
      species: { $ifNull: ["$species.name", ""] },
      my: { $eq: ["$createdBy", mongoose.Types.ObjectId(userId)] },
      breed: { $ifNull: ["$breed", ""] },
      hidePanic:1,
      country:1,
      state:1,
      city:1
    })
    .match({
      $and:[
        {
          "hidePanic.hideBy":{
            $ne:userId
          }
        },
        {
          "hidePanic.hide":{
            $ne:false
          }
        }
      ]
    })
    .sort({
      createdAt: -1,
    })
    .skip(pageNo === 0 || pageNo === 1 || pageNo <= 1 ? 0 : pageNo * perPage)
    .limit(perPage || 10);
  };
  static getMyPanic=(match)=>{
    return Panic.aggregate()
    .match(match)
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
        {$project:{name:1}}
      ]
    })
    .lookup({
      from: "states",
      localField: "state",
      foreignField: "_id",
      as: "state",
      pipeline:[
        {$project:{name:1}}
      ]
    })
    .lookup({
      from: "cities",
      localField: "city",
      foreignField: "_id",
      as: "city",
      pipeline:[
        {$project:{name:1}}
      ]
    })
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
    .unwind({
      path: "$species",
      preserveNullAndEmptyArrays: true,
    })
    .lookup({
      from: "pets",
      localField: "petId",
      foreignField: "_id",
      as: "petfromId",
    })

    .unwind({
      path: "$petfromId",
      preserveNullAndEmptyArrays: true,
    })
    .match({
      "petfromId.deleted":{
        $ne:true
      }
    })
    .project({
      // country: {
      //   $cond: { if: "$country", then: "$country.name", else: "" },
      // },
      // color: {
      //   $cond: { if: "$color", then: "$color.name", else: "" },
      // },
      color: 1,
      detail: 1,
      age: { $ifNull: ["$pet.age", ""] },
      petOwner: 1,
      founder: 1,
      other: 1,
      type: 1,
      createdAt: 1,
      location: 1,
      images: 1,
      date: 1,
      species: { $ifNull: ["$species.name", ""] },
      breed: { $ifNull: ["$breed", ""] },
      country:1,
      state:1,
      city:1
    })
    .sort({
      createdAt: -1,
    });
  }
}
module.exports = PanicService;
