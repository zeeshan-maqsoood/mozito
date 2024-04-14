const router=require("express").Router()
const {notificationForUsers}=require("../../controller/notification")

router.post("/add",notificationForUsers)

module.exports=router