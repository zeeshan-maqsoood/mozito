const mongoose = require("mongoose");
const FriendsService = require("../service/friends");
const PetService = require("../service/pet");
const PairingService = require("../service/pairing");
const {
  firebaseNotificationUser,
} = require("../common/firebaseNotificationHelper");
const notificationMessages = require("../common/notificationMessages");
const FriendService = require("../service/friends");

const removeduplicatesinObjectsPairing = (arr) => {
  return [...new Map(arr.map((item) => [item._id.toString(), item])).values()];
};

const mergeDuplicate = (friends) => {
  const newarr = removeduplicatesinObjectsPairing(friends);
  return (mergearray = newarr.map((f) => {
    const data = friends.find((f1) => {
      return f1._id.toString() === f._id.toString();
    });
    if (!data) return f;
    else {
      return {
        ...f,
        isPairing: f.isPairing || data.isPairing,
        isFriend: f.isFriend || data.isFriend,
        pairingId: f.pairingId || data.pairingId,
      };
    }
  }));
};

exports.myfriends = async (req, res, next) => {
  try {
    const search = req.query.search || "";
    const mypetId = req.selected_pet._id.toString();
    // console.log("mypetId => ",mypetId)
    const normalizeFriend = await FriendsService.getNormalizeFriend(
      mypetId,
      "accepted"
    );
    if(normalizeFriend.length>1){
      await FriendService.updateFriend({from:req.selected_pet._id,to:"6156f131cff1a4b5e17a0460"},{status:"unfriend"})
    }
    // console.log("normalizeFriend => ",normalizeFriend.length)
    const myFriends = await FriendsService.getMyFriends(
      mypetId,
      normalizeFriend,
      search
    );
    // console.log("myFriends => ",myFriends)
    let pairing = await PairingService.getPairingRequestAccepted(
      mypetId,
      normalizeFriend,
      "accepted",
      search
    );
    // if (!myFriends.length)
    //   return next({ status: 404, msg: "you don't have any friends" });
    let combine = myFriends.concat(pairing);
    const sortedCombine = combine.sort((a, b) => (b.date > a.date ? 1 : -1));
    return res.status(200).json({
      success: true,
      data: { friends: mergeDuplicate(sortedCombine) },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};


exports.getFriendsById = async (req, res, next) => {
  try {
    const search = req.query.search || "";
    const mypetId = req.params.id.toString();
    const normalizeFriend = await FriendsService.getNormalizeFriend(
      mypetId,
      "accepted"
    );
    const myFriends = await FriendsService.getMyFriends(
      mypetId,
      normalizeFriend,
      search
    );
    return res.status(200).json({
      success: true,
      data: { friends:myFriends },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.unFriend = async (req, res, next) => {
  try {
    const request = await FriendsService.getFriend(
      req.selected_pet._id,
      req.params.id,
      "accepted"
    );
    if (!request)
      return next({
        status: 404,
        msg: "this pet is not in your friend list",
      });
    request.status = "unfriend";
    await request.save();
    return res.status(200).json({
      success: true,
      data: { msg: "unfriend done" },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.blockFriend = async (req, res, next) => {
  try {
    const request = await FriendsService.getFriend(
      req.selected_pet._id,
      req.params.id,
      "accepted"
    );
    if (!request)
      return next({
        status: 404,
        msg: "this pet is not in your friend list",
      });
    request.status = "blocked";
    await request.save();
    return res.status(200).json({
      success: true,
      data: { msg: "friend blocked done" },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.unblockFriend = async (req, res, next) => {
  try {
    const request = await FriendsService.getFriend(
      req.selected_pet._id,
      req.params.id,
      "blocked"
    );
    if (!request)
      return next({
        status: 404,
        msg: "this pet is not in your blocked list",
      });
    request.status = "accepted";
    await request.save();
    return res.status(200).json({
      success: true,
      data: { msg: "friend unblocked done" },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.nosuggetions = async (req, res, next) => {
  try {
    const mypetId = req.selected_pet._id.toString();
    if (mypetId === req.params.id)
      return next({
        status: 400,
        msg: "you cannot remove suggestions to yourself",
      });

    const pet = await PetService.getPetSimply({ _id: mypetId });
    if (!pet) return next({ status: 404, msg: "Pet not found" });

    pet.nosuggetions = pet.nosuggetions.concat(mongoose.Types.ObjectId(req.params.id))
    await pet.save()
    // console.log("pet => ",pet)

    return res.status(200).json({
      success: true,
      data: { msg: "ID remove from suggestions." },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.sendFriendRequest = async (req, res, next) => {
  try {
    // const socketUser = req.app.io.nsps["/user"]
    const mypetId = req.selected_pet._id.toString();
    if (mypetId === req.params.id)
      return next({
        status: 400,
        msg: "you cannot send friend request to yourself",
      });

    const pet = await PetService.getPetSimply({ _id: req.params.id });
    if (!pet) return next({ status: 404, msg: "Pet not found" });
    const isFriend = await FriendsService.getFriend(
      mypetId,
      req.params.id,
      "accepted"
    );
    if (isFriend)
      return res.status(200).json({
        success: true,
        data: { msg: "you already a friend" },
        msg: "ok",
        status: 200,
      });
    //
    const isAlreadysent = await FriendsService.getFriend(
      mypetId,
      req.params.id,
      "pending"
    );
    if (isAlreadysent)
      return res.status(200).json({
        success: true,
        data: { msg: "you already sent a request" },
        msg: "ok",
        status: 200,
      });
    const friendRequest = FriendsService.newFriendReq({
      from: mypetId,
      to: req.params.id,
    });
    await friendRequest.save();

    // push notification

    // realtime communication
    // socketUser.emit(`${notification.to}-notification`, notification);
    // await pet.save();
    // console.log(pet);
    // for firebase push notification
    firebaseNotificationUser(
      pet,
      req,
      notificationMessages.friendRequestSentTitle,
      notificationMessages.friendRequestSentbody(req.selected_pet.name),
      "",
      "allrequestsview"
    );
    return res.status(200).json({
      success: true,
      data: { msg: "friend request sent" },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.requestReceive = async (req, res, next) => {
  try {
    const mypetId = req.selected_pet._id.toString();
    const findpet = await PetService.getPetSimply({ _id: mypetId });
    if (!findpet) return next({ status: 404, msg: "Pet not found" });
    
    const normalizeFriend = await FriendsService.getNormalizeFriend(
      mypetId,
      "accepted"
    );
    const allfriendsincludingReq = await FriendsService.getNormalizeFriend(
      mypetId,
      "accepted,pending"
    );

    const friendRequest = FriendsService.getRequestReceive(
      mypetId,
      normalizeFriend
    );
    let pairingQuery = PairingService.getPairingRequestReceive(
      mypetId,
      normalizeFriend
    );
    const petInterest = req.selected_pet.interest.map((intr) =>
      mongoose.Types.ObjectId(intr)
    );
    // console.log("pet => ",findpet.nosuggetions)
    // console.log("allfriendsincludingReq => ",allfriendsincludingReq)
    const notinIds = [
      mongoose.Types.ObjectId("6156f131cff1a4b5e17a0460"),
      mongoose.Types.ObjectId(mypetId),
      ...findpet.nosuggetions,
      ...allfriendsincludingReq,
    ];
    // console.log("mypetId => ",mypetId)
    // console.log("notinIds => ",notinIds)
    let suggestionQuery = PetService.getSuggestion(
      mypetId,
      normalizeFriend,
      notinIds,
      petInterest
    );
    const [pet, pairing, suggestion] = await Promise.all([
      friendRequest,
      pairingQuery,
      suggestionQuery,
    ]);
    let combine = pet.concat(pairing);
    const sortedCombine = combine.sort((a, b) => (b.date > a.date ? 1 : -1));
    return res.status(200).json({
      success: true,
      data: {
        requests: sortedCombine,
        suggestion,
      },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};
exports.requestSent = async (req, res, next) => {
  try {
    const mypetId = req.selected_pet._id.toString();
    const normalizeFriend = await FriendsService.getNormalizeFriend(
      mypetId,
      "accepted"
    );

    const friendRequestSent = await FriendsService.getRequestSent(
      mypetId,
      normalizeFriend
    );
    return res.status(200).json({
      success: true,
      data: { friendRequestSent },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.acceptFriendRequest = async (req, res, next) => {
  try {
    // const socketUser = req.app.io.nsps["/user"];
    const request = await FriendsService.updateFriend(
      {
        to: req.selected_pet._id,
        from: req.params.id,
        status: "pending",
      },
      { status: "accepted" }
    );
    if (!request)
      return next({
        status: 404,
        msg: "you have not received a friend request from this pet",
      });
    const pet = await PetService.getPetSimply({ _id: req.params.id });
    // firebase notification
    firebaseNotificationUser(
      pet,
      req,
      notificationMessages.acceptFriendRequestTitle(req.selected_pet.name),
      notificationMessages.acceptFriendRequestBody(req.selected_pet.name),
      req.params.id,
      "friends"
    );

    return res.status(200).json({
      success: true,
      data: { msg: "friend request accepted" },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.rejectFriendRequest = async (req, res, next) => {
  try {
    const request = await FriendsService.updateFriend(
      {
        to: req.selected_pet._id,
        from: req.params.id,
        status: "pending",
      },
      { status: "rejected" }
    );
    if (!request)
      return next({
        status: 404,
        msg: "you have not received a friend request from this pet",
      });
      const pet=await PetService.getPetSimply({_id:req.params.id});
      if(!pet) return next({status:404,msg:"pet not found"});
    firebaseNotificationUser(
      pet,
      req,
      `${req.selected_pet.name} Reject Your Friend Request`,
      "",
      req.params.id,
      "friends"
    );

    return res.status(200).json({
      success: true,
      data: { msg: "friend request rejected" },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.cancelFriendRequest = async (req, res, next) => {
  try {
    const request = await FriendsService.updateFriend(
      {
        from: req.selected_pet._id,
        to: req.params.id,
        status: "pending",
      },
      { status: "canceled" }
    );
    if (!request)
      return next({
        status: 404,
        msg: "you have not sent a friend request to this pet",
      });
    return res.status(200).json({
      success: true,
      data: { msg: "Request canceled" },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.mostfollowingFriends = async (req,res,next) => {
  try {
    let perPage=Number(req.query.perPage||10)
    let pageNo=Number(req.query.pageNo||1)
    const mostfollowingfriends=await FriendService.mostfollowingFriends(perPage,pageNo)
    const countmostfollowingfriends=await FriendService.countMostfollowingFriends()
    let count
    if(countmostfollowingfriends.length>0)count=countmostfollowingfriends[0].count
    else count=0
    return res.status(200).json({
      success: true,
      data: { count,mostfollowingfriends },
      msg: "ok",
      status: 200,
    })
  } catch (error) {
    return next(error)
  }
}