const { StatusModel } = require("../models");
const mongoose = require("mongoose");
class StatusService {
  constructor() {}
  static getStatus = (match) => {
    const nowDate = new Date()
    return StatusModel.aggregate([
        {$match:match},
        {
          $lookup: {
            from: "pets",
            localField: "pet",
            foreignField: "_id",
            as: "pet",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$pet", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {$project:{
          deleted:1,
          mediaList:{
            $filter:{
              input:"$mediaList",
              as:"date",
              cond:{$gte:["$$date.statusOffDate",nowDate]}
            }
          },
          "user.name":1,
          "pet.photo":1,
          "pet.name":1,
          createdAt:1,
          updatedAt:1,
          watched:1
        }},
        {$match:{
          $expr:{
            $gt:[{$size:"$mediaList"},0]
          }
        }}
    ])
  }
  static getStatusByID = (match) => {
    return StatusModel.findById(match)
    .populate("user","name")
    .populate("pet","photo name")
    .select("-__v")
  }
}
module.exports = StatusService;
