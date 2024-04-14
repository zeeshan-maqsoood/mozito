const { Schedule } = require("../models");
class ScheduleService {
  constructor() {}
  static getAllSchedulefornotification = (match={}) => {
    return Schedule.aggregate([
        {
          $match: match,
        },
        {
          $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
          },
        },
        {
          $unwind: {
            path: "$owner",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "pets",
            localField: "pet",
            foreignField: "_id",
            as: "petinfo",
          },
        },
        {
          $unwind: {
            path: "$petinfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            fcmToken: "$owner.fcmToken",
          },
        },
        {
            $match:{
                fcmToken:{
                    $ne:""
                }
            }
        },
        {
          $sort:{
            datetime:-1
          }
        }
      ]);;
  };
}
module.exports = ScheduleService;
