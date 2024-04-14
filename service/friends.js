const { Friends,Pet } = require("../models");
const mongoose = require("mongoose");
class FriendService {
  constructor() {}
  static getMyFriendsSimply = (id, status) => {
    const s = status.split(",");
    return Friends.find({
      $or: [{ from: id }, { to: id }],
      status: {
        $in: s,
      },
      deleted:{
        $ne:true
      }
    });
  };
  static getMyFriendsSimplyWithOwner = (id, status) => {
    const s = status.split(",");
    return Friends.aggregate([
      {
        $match: {
          $or: [
            {
              from: id,
            },
            {
              to: id,
            },
          ],
          status: "accepted",
        }
      },
      {
        $addFields: {
          petId: {
            $cond: {
              if: {
                $eq: [id, "$from"],
              },
              then: "$to",
              else: "$from",
            },
          },
        },
      },
      {
        $lookup: {
          from: "pets",
          localField: "petId",
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
        $addFields:{
          owner:"$pet.owner",
        }        
      }
    ]);
    // return Friends.find({
    //   $or: [{ from: id }, { to: id }],
    //   status: {
    //     $in: s,
    //   },
    // });
  };
  static getMyFriends = (id, normalizeFriend, searchQuery = "") => {
    const search = RegExp(searchQuery || "", "i");
    const m_id = mongoose.Types.ObjectId(id);
    // const n_id = mongoose.Types.ObjectId("6156f131cff1a4b5e17a0460")
    return Friends.aggregate([
      {
        $match: {
          $or: [
            {
              // from: {$in:[n_id,m_id]},
              from:m_id
            },
            {
              // to: {$in:[n_id,m_id]},
              to:m_id
            },
          ],
          status: "accepted",
        },
      },
      {
        $addFields: {
          petId: {
            $cond: {
              if: {
                $eq: [m_id, "$from"],
              },
              then: "$to",
              else: "$from",
            },
          },
        },
      },
      {
        $lookup: {
          from: "pairings",
          let:{
            petId:"$petId"
          },
          pipeline: [
            {
              $match: {
                $expr:{
                  $and:[
                    {
                      $eq:["$to", "$$petId"]
                    },
                    {
                      $eq:["$from", m_id]
                    },
                    {
                      $eq:["$paringStatus","pending"]
                    }

                  ]
                },
              },
            },
            // {
            //   $project:{
            //     petId:"$$petId",
            //     to:"$to",
            //     from:"$from",
            //     paringStatus:"$paringStatus"
            //   }
            // }
          ],
          as: "pairingSent",
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
                      $ne: [m_id, "$from"],
                    },
                    {
                      $ne: [m_id, "$to"],
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
        $lookup: {
          from: "pairings",
          let: {
            petId: "$petId",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      from: m_id,
                    },
                    {
                      to: m_id,
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
                      $eq: ["$from", "$$petId"],
                    },
                    {
                      $eq: ["$to", "$$petId"],
                    },
                  ],
                },
                pairingStatus: "accepted",
              },
            },
            {
              $addFields: {
                petId: "$$petId",
              },
            },
          ],
          as: "pairing",
        },
      },
      {
        $lookup: {
          from: "pets",
          localField: "petId",
          foreignField: "_id",
          as: "pet",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "pet.owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      {
        $unwind: {
          path: "$pet",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$owner",
          preserveNullAndEmptyArrays: true,
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
          isPairingSent: {
            $cond: {
              if: {
                $gt: [
                  {
                    $size: "$pairingSent",
                  },
                  0,
                ],
              },
              then: true,
              else: false,
            },
          },
          _id: "$pet._id",
          name: "$pet.name",
          owner: "$owner.name",
          photo: "$pet.photo",
          date: "$createdAt",
          friends1: {
            $map: {
              input: "$friends",
              as: "friend",
              in: "$$friend.to",
            },
          },
          friends2: {
            $map: {
              input: "$friends",
              as: "friend",
              in: "$$friend.from",
            },
          },
          pairing: true,
        },
      },
      {
        $match: {
          name: search,
        },
      },
      {
        $addFields: {
          friends: {
            $setIntersection: [
              normalizeFriend,
              {
                $setIntersection: {
                  $setUnion: ["$friends1", "$friends2"],
                },
              },
            ],
          },
          IsPairedWithMe: {
            $cond: {
              if: {
                $gt: [
                  {
                    $size: "$pairing",
                  },
                  0,
                ],
              },
              then: true,
              else: false,
            },
          }
        },
      },
      {
        $addFields: {
          mutual: {
            $size: {
              $filter: {
                input: "$friends",
                as: "fr",
                cond: {
                  $ne: ["$$fr", "$_id"],
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          isPairing: false,
          isFriend: true,
        },
      },
      {
        $project: {
          friends1: false,
          friends2: false,
          pairing: false,
          friends: false,
        },
      },
    ]);
  };

  static getMyFriendsOwnerforNotification = (id) => {
    const m_id = mongoose.Types.ObjectId(id);
    return Friends.aggregate([
      {
        $match: {
          $or: [
            {
              from: m_id,
            },
            {
              to: m_id,
            },
          ],
          status: "accepted",
        },
      },
      {
        $addFields: {
          petId: {
            $cond: {
              if: {
                $eq: [m_id, "$from"],
              },
              then: "$to",
              else: "$from",
            },
          },
        },
      },
      {
        $lookup: {
          from: "pets",
          localField: "petId",
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
        $project: {
          _id: "$pet._id",
          name: "$pet.name",
          owner: "$pet.owner",
        },
      },
    ]);
  };
  static getRequestReceive = (mypetId, normalizeFriend) => {
    return Friends.aggregate([
      {
        $match: {
          to: mongoose.Types.ObjectId(mypetId),
          status: "pending",
        },
      },
      {
        $addFields: {
          petId: "$from",
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
        $lookup: {
          from: "pairings",
          let: {
            petId: "$petId",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      from: mongoose.Types.ObjectId(mypetId),
                    },
                    {
                      to: mongoose.Types.ObjectId(mypetId),
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
                      $eq: ["$from", "$$petId"],
                    },
                    {
                      $eq: ["$to", "$$petId"],
                    },
                  ],
                },
                pairingStatus: "accepted",
              },
            },
            {
              $addFields: {
                petId: "$$petId",
              },
            },
          ],
          as: "pairing",
        },
      },
      {
        $lookup: {
          from: "pets",
          localField: "petId",
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
        $project: {
          _id: "$pet._id",
          name: "$pet.name",
          photo: "$pet.photo",
          date: "$createdAt",
          friends1: {
            $map: {
              input: "$friends",
              as: "friend",
              in: "$$friend.to",
            },
          },
          friends2: {
            $map: {
              input: "$friends",
              as: "friend",
              in: "$$friend.from",
            },
          },
          pairing: 1,
        },
      },
      {
        $addFields: {
          friends: {
            $setIntersection: [
              normalizeFriend,
              {
                $setIntersection: {
                  $setUnion: ["$friends1", "$friends2"],
                },
              },
            ],
          },
          IsPairedWithMe: {
            $cond: {
              if: {
                $gt: [
                  {
                    $size: "$pairing",
                  },
                  0,
                ],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $addFields: {
          isPairingReq: false,
          isFriendReq: true,
          mutual: {
            $size: {
              $filter: {
                input: "$friends",
                as: "fr",
                cond: {
                  $ne: ["$$fr", "$_id"],
                },
              },
            },
          },
        },
      },
      {
        $project: {
          friends1: false,
          friends2: false,
          pairing: false,
          friends: false,
        },
      },
    ]);
  };
  static getRequestSent = (mypetId, normalizeFriend) => {
    return Friends.aggregate([
      {
        $match: {
          from: mongoose.Types.ObjectId(mypetId),
          status: "pending",
        },
      },
      {
        $addFields: {
          petId: "$to",
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
        $lookup: {
          from: "pairings",
          let: {
            petId: "$petId",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      from: mongoose.Types.ObjectId(mypetId),
                    },
                    {
                      to: mongoose.Types.ObjectId(mypetId),
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
                      $eq: ["$from", "$$petId"],
                    },
                    {
                      $eq: ["$to", "$$petId"],
                    },
                  ],
                },
                pairingStatus: "accepted",
              },
            },
            {
              $addFields: {
                petId: "$$petId",
              },
            },
          ],
          as: "pairing",
        },
      },
      {
        $lookup: {
          from: "pets",
          localField: "petId",
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
        $project: {
          _id: "$pet._id",
          name: "$pet.name",
          photo: "$pet.photo",
          date: "$createdAt",
          friends1: {
            $map: {
              input: "$friends",
              as: "friend",
              in: "$$friend.to",
            },
          },
          friends2: {
            $map: {
              input: "$friends",
              as: "friend",
              in: "$$friend.from",
            },
          },
          pairing: true,
        },
      },
      {
        $addFields: {
          friends: {
            $setIntersection: [
              normalizeFriend,
              {
                $setIntersection: {
                  $setUnion: ["$friends1", "$friends2"],
                },
              },
            ],
          },
          IsPairedWithMe: {
            $cond: {
              if: {
                $gt: [
                  {
                    $size: "$pairing",
                  },
                  0,
                ],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $addFields: {
          mutual: {
            $size: {
              $filter: {
                input: "$friends",
                as: "fr",
                cond: {
                  $ne: ["$$fr", "$_id"],
                },
              },
            },
          },
        },
      },
      {
        $project: {
          friends1: false,
          friends2: false,
          pairing: false,
          friends: false,
        },
      },
    ]);
  };
  static getNormalizeFriend = async (mypetId, status = "accepted") => {
    const myfriends = await this.getMyFriendsSimply(mypetId, status);
    return myfriends.map((f) => {
      if (f.to.toString() === mypetId) {
        return mongoose.Types.ObjectId(f.from);
      } else {
        return mongoose.Types.ObjectId(f.to);
      }
    });
  };
  static getOwnerIds = async (mypetId, status = "accepted") => {
    const myfriends = await this.getMyFriendsSimplyWithOwner(mypetId, status);
    return myfriends.map((f) => {
        return mongoose.Types.ObjectId(f.pet.owner);
    });
  };
  static getFriend = (mypetId, friendId, status = "accepted") => {
    return Friends.findOne({
      $or: [
        {
          to: mypetId,
          from: friendId,
        },
        {
          from: mypetId,
          to: friendId,
        },
      ],
      status,
    });
  };
  static updateFriend = (match, request) => {
    return Friends.findOneAndUpdate(match, request, { new: true });
  };
  static newFriendReq = (request) => {
    return new Friends(request);
  };
  static mostfollowingFriends = (perPage,pageNo) =>{
    return Pet.aggregate([
      {
        $lookup:{
          from:"friends",
          let:{
            petId:"$_id"
          },
          pipeline:[
            {
              $match:{
                $expr:{
                  $or:[
                    {
                        $eq:["$to","$$petId"]
                    },
                    {
                        $eq:["$from","$$petId"]
                    }
                  ],
                }
              }
            }
          ],
          as:"friends"
        }  
      },
      {
        $project:{
          name:1,photo:1,
          friends:{$size:{$ifNull:["$friends",[]]}},
          createdAt:1
        }
      },
      {
        $sort:{friends:-1}
      },
      {
        $skip:(pageNo-1)*perPage
      },
      {
        $limit:perPage
      }
    ]);
    // return Friends.aggregate([
    //   {$lookup:{from:"pets",as:"from",
    //     let:{fromID:"$from"},
    //     pipeline:[
    //       {$match:{$expr:{$eq:["$_id","$$fromID"]}}},
    //       {$project:{name:1,photo:1}}
    //     ]
    //   }},
    //   {$lookup:{from:"pets",as:"to",
    //     let:{toID:"$to"},
    //     pipeline:[
    //       {$match:{$expr:{$eq:["$_id","$$toID"]}}},
    //       {$project:{name:1,photo:1}}
    //     ]
    //   }},
    //   {$unwind:{path:"$from",preserveNullAndEmptyArrays:true}},
    //   {$unwind:{path:"$to",preserveNullAndEmptyArrays:true}},
    //   {$project:{__v:false}},
    //   {$match:{status:"accepted"}},
    //   {$sort:{createdAt:-1}},
    //   {$skip:(pageNo-1)*perPage},
    //   {$limit:perPage}
    // ])
  }
  static countMostfollowingFriends = () =>{
    return Pet.aggregate([
      {
        $lookup:{
          from:"friends",
          let:{
            petId:"$_id"
          },
          pipeline:[
            {
              $match:{
                $expr:{
                  $or:[
                    {
                        $eq:["$to","$$petId"]
                    },
                    {
                        $eq:["$from","$$petId"]
                    }
                  ],
                }
              }
            }
          ],
          as:"friends"
        }  
      },
      {
        $project:{
          name:1,photo:1,
          friends:{$size:{$ifNull:["$friends",[]]}}
        }
      },
      {$count:"count"}
    ])
  }
}

module.exports = FriendService;
