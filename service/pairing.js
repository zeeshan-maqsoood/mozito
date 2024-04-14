const { Pairing } = require("../models");
const mongoose = require("mongoose");


class PairingService {
  constructor() {}
  static getPairingRequestReceive = (
    mypetId,
    normalizeFriend,
    paringStatus = "pending"
  ) => {
    return Pairing.aggregate([
      {
        $match: {
          to: mongoose.Types.ObjectId(mypetId),
          paringStatus,
        },
      },
      {
        $lookup: {
          from: "pets",
          localField: "from",
          foreignField: "_id",
          as: "pet",
        },
      },
      {
        $unwind: {
          path: "$pet",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "friends",
          let: {
            toPet: "$petId",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $ne: [mongoose.Types.ObjectId(mypetId), "$from"],
                    },
                    {
                      $ne: [mongoose.Types.ObjectId(mypetId), "$to"],
                    },
                  ],
                },
              },
            },
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      $eq: ["$$toPet", "$from"],
                    },
                    {
                      $eq: ["$$toPet", "$to"],
                    },
                  ],
                },
                status: "accepted",
              },
            },
            {
              $addFields: {
                topet: "$$toPet",
              },
            },
          ],
          as: "friends",
        },
      },
      {
        $project: {
          name: "$pet.name",
          petId:"$pet._id",
          friends: {
            $map: {
              input: "$friends",
              as: "friend",
              in: "$$friend.pet",
            },
          },
          photo: "$pet.photo",
          date: "$createdAt",
        },
      },
      {
        $project: {
          name: 1,
          mutual: {
            $size: {
              $setIntersection: ["$friends", normalizeFriend],
            },
          },
          photo: 1,
          date: 1,
          petId:1
        },
      },
      {
        $addFields: {
          isPairingReq: true,
          isFriendReq: false,
        },
      },
    ]);
  };

  static getPairingRequestAccepted = (
    mypetId,
    normalizeFriend,
    paringStatus = "accepted",
    searchQuery=""
  ) => {
    const  search=RegExp(searchQuery || "", "i")
    return Pairing.aggregate([
      {
        $match: {
          $or: [
            {
              to: mongoose.Types.ObjectId(mypetId),
            },
            {
              from: mongoose.Types.ObjectId(mypetId),
            },
          ],
          paringStatus,
        },
      },
      {
        $addFields: {
          otherPet: {
            $cond: {
              if: {
                $eq: [mongoose.Types.ObjectId(mypetId), "$to"],
              },
              then: "$from",
              else: "$to",
            },
          },
        },
      },
      {
        $lookup: {
          from: "pets",
          localField: "otherPet",
          foreignField: "_id",
          as: "pet",
        },
      },
      {
        $unwind: {
          path: "$pet",
          preserveNullAndEmptyArrays: true,
        },
      },
      // {
      //   $match:{
      //     pet:{
      //       name:search
      //     }
      //   }
      // },
      {
        $lookup: {
          from: "friends",
          let: {
            toPet: "$petId",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $ne: [mongoose.Types.ObjectId(mypetId), "$from"],
                    },
                    {
                      $ne: [mongoose.Types.ObjectId(mypetId), "$to"],
                    },
                  ],
                },
              },
            },
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      $eq: ["$$toPet", "$from"],
                    },
                    {
                      $eq: ["$$toPet", "$to"],
                    },
                  ],
                },
                status: "accepted",
              },
            },
            {
              $addFields: {
                topet: "$$toPet",
              },
            },
          ],
          as: "friends",
        },
      },
      {
        $match:{
          "pet.deleted":{
            $ne:true
          }
        }
      },
      {
        $project: {
          pairingId: "$_id",
          _id: "$pet._id",
          name: "$pet.name",
          friends: {
            $map: {
              input: "$friends",
              as: "friend",
              in: "$$friend.pet",
            },
          },
          photo: "$pet.photo",
          date: "$createdAt",
        },
      },
      {
        $project: {
          name: 1,
          mutual: {
            $size: {
              $setIntersection: ["$friends", normalizeFriend],
            },
          },
          photo: 1,
          date: 1,
          pairingId:1
        },
      },
      {
        $addFields: {
          isPairing: true,
          isFriend: {
            $in: ["$_id", normalizeFriend],
          },
        },
      },
      {
        $match:{
          // pet:{
            name:search
          // }
        }
      },
    ]);
  };

  static getPairingRequstSent = (mypetId, normalizeFriend) => {
    return Pairing.aggregate([
      {
        $match: {
          from: mongoose.Types.ObjectId(mypetId),
          paringStatus: "pending",
          active: true,
        },
      },
      {
        $lookup: {
          from: "pets",
          localField: "to",
          foreignField: "_id",
          as: "to",
        },
      },
      {
        $unwind: {
          path: "$to",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          photo: "$to.photo",
          petId: "$to._id",
          friends: {
            $map: {
              input: "$to.friends",
              as: "friend",
              in: "$$friend.pet",
            },
          },
        },
      },
      {
        $project: {
          name: 1,
          mutual: {
            $size: {
              $setIntersection: ["$friends", normalizeFriend],
            },
          },
          photo: 1,
          petId: 1,
        },
      },
    ]);
  };
  static getPairing = (match) => {
    return Pairing.findOne(match);
  };
}
module.exports = PairingService;
