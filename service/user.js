const { User,UserDelete } = require("../models");

class UserService {
  constructor() {}
  static newUser = (request) => {
    return new User(request);
    // return new User(request).save();
  };
  static getUserAggregate=(match)=>{
    return User.aggregateWithDeleted([
      {
        $match:match
      }
    ]);
  }
  static getUser = (match) => {
    return User.findOneWithDeleted(match).populate(
      "pet",
      "stage name photo friends isVerified"
    );
  };
  static getUserSimply = (match) => {
    return User.findOne(match);
  };
  static updateUser = (match, update) => {
    return User.findOneAndUpdate(match, update, { new: true });
  };
  static getUserinfo = (match,id="") => {
    return User.aggregate([
      {
        $match: match
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
          path: "$country",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "states",
          localField: "state",
          foreignField: "_id",
          as: "state",
        },
      },
      {
        $unwind: {
          path: "$state",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "cities",
          localField: "city",
          foreignField: "_id",
          as: "city",
        },
      },
      {
        $unwind: {
          path: "$city",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "pets",
          pipeline:[
            {
              $match:{
                owner:{
                  $eq:id
                },
                  deleted:{
                  $ne:true
                }
              }
            },
            ],
          as: "pets",
        },
      },
      {
        $project: {
          country: {
            name: 1,
            _id: 1,
          },
          state: {
            name: 1,
            _id: 1,
          },
          city: {
            name: 1,
            _id: 1,
          },
          name: 1,
          email: 1,
          joiningDate: "$createdAt",
          secondaryEmail: 1,
          petCount:{
            "$size":"$pets"
          }
        },
      },
    ]);
  };
}
module.exports = UserService;
