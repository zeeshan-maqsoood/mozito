const router = require("express").Router();
const mongoose = require("mongoose");
const { User, Notification, Pet, Pairing, Friends } = require("../../models");
const { idValidator } = require("../../middlewares");
const { difference, extend, uniq } = require("lodash");
const { apiLimiter, uniqbyIds } = require("../../utils");
const notificationMessages = require("../../common/notificationMessages");
const {
  firebaseNotificationUser,
} = require("../../common/firebaseNotificationHelper");
const {myfriends,blockFriend,unblockFriend,unFriend,getFriendsById, sendFriendRequest, requestReceive, requestSent, acceptFriendRequest, rejectFriendRequest, cancelFriendRequest,nosuggetions}= require("../../controller/friends")
router.param("id", idValidator);

// ok-hyf
// tested-2
router.get("/my", myfriends);
// test
// tested
// unfriend a User
// id=PetId
//  if any user unfriend a friend then both friendlist will pop eachother
router.put("/unfriend/:id", unFriend);

router.put("/block/:id", blockFriend);

router.put("/unblock/:id", unblockFriend);

router.put("/nosuggetion/:id",nosuggetions)

// tested
// send a friend request
// id=PetId
// clean below code after testing
router.post("/sendRequest/:id", sendFriendRequest);

// tested
router.get("/request/receive", requestReceive);

// tested
// all request sent
router.get("/request/sent", requestSent);

// tested
// friend accept request
// id is pet id
router.put("/acceptRequest/:id",acceptFriendRequest);

// tested
// id=petId
// friend  reject request;
router.put("/rejectRequest/:id", rejectFriendRequest);
// tested
// friend cancel sending friend request
router.put("/cancelRequest/:id", cancelFriendRequest);
router.get("/ById/:id",getFriendsById );

module.exports = router;
