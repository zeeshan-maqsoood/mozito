const router=require("express").Router()
const {mostfollowingFriends}=require("../../controller/friends")

router.get("/mostfollowingfriends",mostfollowingFriends)

module.exports=router