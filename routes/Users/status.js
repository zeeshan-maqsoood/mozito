const { User,Pet,StatusModel,Friends } = require("../../models")
const router = require("express").Router()
const StatusService = require("../../service/status")
const FriendService = require("../../service/friends")
const mongoose = require("mongoose")
const { upload } = require("../../s3")
const Upload = upload('app/status')
const io = require('../../index')

let connectionIds = {}
io.on("connection", (socket) => {
  // console.log(socket.handshake.headers.host)
  socket.on('petId',e=>{
    connectionIds[socket.id]=e
    // connectionIds = {
    //   ...connectionIds,
    //   e:socket.id
    // }
    // console.log("e =>=>=> ", e)
    console.log("conn => ",connectionIds)
  })

  socket.on("disconnect", () => {
    // console.log(socket.id, " Disconnected")
    for (const [key, value] of Object.entries(connectionIds)) {
      delete connectionIds[key]===socket.id
    }
    // console.log("dis => ",connectionIds)
  })
})

router.post("/",Upload.fields([
  {name: 'mediaList',maxCount: 4}
]),async (req,res,next)=>{
  try {
    // console.log("connectionIds => ",connectionIds)
      const statusOffDate = new Date()
      statusOffDate.setDate(statusOffDate.getDate() + 1)
      // statusOffDate.setMinutes(statusOffDate.getMinutes()+5)
      let status
      const user = await User.findById({_id:req.user._id})
      const pet = await Pet.findById({_id:req.selected_pet._id})
      if (!user) return next({ status: 404, msg: "User Not Found" })
      if (!pet) return next({ status: 404, msg: "Pet Not Found" })
      const { files } = req
      const { isVideo } = req.body
      // console.log("isVideo => ",isVideo)
      if(!files||!files.mediaList||!isVideo)
        next({ status: 400, msg: "mediaList and isVideo field is required." })
      else{
        const alreadyStatus = await StatusModel.findOne({user:req.user._id,pet:req.selected_pet._id})
        if(alreadyStatus){
          files.mediaList.map(e=>alreadyStatus.mediaList.push({
            url:e.location,
            isVideo:isVideo==='true'?true:false,
            // video:(e.mimetype.split('/')[0]||e.contentType.split('/')[0])==='video'?true:false,
            statusOffDate
          }))
          // console.log("alreadyStatus =>",alreadyStatus)
          status = alreadyStatus
        }
        else{
          let data={
            mediaList:files.mediaList.map(e=>{return {
                url:e.location,
                isVideo:isVideo==='true'?true:false,
                statusOffDate
            }}),
            user:user._id,
            pet:pet._id
          }
          status = new StatusModel(data)
        }
        // console.log("date => ",new Date().getDate()+1)
        status.watched=false
        await status.save()
        const mypetId = req.selected_pet._id.toString()
        // const normalizeFriend = await FriendService.getNormalizeFriend(mypetId)
        let connectionids = []
        for(const [key, value] of Object.entries(connectionIds)){
          let friend
          if(key!==undefined){
            friend = await Friends.findOne({$or:[
            {from:mongoose.Types.ObjectId(mypetId),to:mongoose.Types.ObjectId(value)},
            {to:mongoose.Types.ObjectId(mypetId),from:mongoose.Types.ObjectId(value)}
            ],status:"accepted"})
          }
          // console.log("friend => ",friend)
          if(friend)connectionids.push({id:key})
        }
        // console.log("connectionids => ",connectionids)
        // const match = {
        //   pet: { $in: [
        //     mongoose.Types.ObjectId("6156f131cff1a4b5e17a0460"),
        //     ...normalizeFriend, 
        //     mongoose.Types.ObjectId(mypetId)
        //   ] }
        // }
        // const totalStatus = await StatusService.getStatus(match)
        // console.log("totalStatus => ",totalStatus)
        // const watchedStatus = totalStatus.filter(e=>e.watched===true)
        // const noWatchedStatus = totalStatus.filter(e=>e.watched===false)
        // const newStatus = noWatchedStatus.concat(watchedStatus)
        const newStatus = await StatusService.getStatusByID(status._id)
        // console.log("status => ",newStatus)
        // io.sockets.connected[String('Prxm_ttTKTYFOnOoAAAB')].emit("newStatus",newStatus)
        // io.sockets.socket(String(connectionId.id)).emit(newStatus)
        connectionids.map(e=>io.to(e.id).emit("newStatus",newStatus))
        // socket.broadcast.to(connectionId.id).emit("newStatus",newStatus)
        // io.emit("newStatus",newStatus)
        return res
        .status(200)
        .json({ success: true, data: { status }, msg: "ok", status: 200 });
    }
  } catch (error) {
    return next(error);
  }
})

router.put("/:id",async (req,res,next)=>{
  try {
        let status = await StatusModel.findById({_id:req.params.id})
        if (!status) return next({ status: 404, msg: "status with this id is not found" })
        status.watched=true
        await status.save()
        return res
        .status(200)
        .json({ success: true, data: { status }, msg: "ok", status: 200 });
    }
  catch (error) {
    return next(error);
  }
})

// router.get("/",async(req,res,next)=>{
//   try {
//     let status = await StatusModel.find()
//     return res
//     .status(200)
//     .json({ success: true, data: { status }, msg: "ok", status: 200 });
//   } catch (error) {
//     return next(error)
//   }
// })

module.exports = router;
