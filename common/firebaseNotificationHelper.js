const { User, Notification, Pet, Admin, Friends, Post } = require("../models");
const PushNotificationService = require("./push-notification");
const FriendsService= require("../service/friends");
// pet => whome you want to send a notification
// req=> whole request
// title => title of notification
// body => body of notification
// screen => screen to navigate 
exports.firebaseNotificationUser = async (pet, req, title, body,  screenId,screenName) => {
    try {
        const user = await User.findById(pet.owner)
            .populate("pet", "name");
        // let frompet,post
        let frompet
        if(title==="Welcome"){
            frompet="6156f131cff1a4b5e17a0460"
            const friend = new Friends({from:req.selected_pet._id,to:"6156f131cff1a4b5e17a0460",status:"accepted"})
            await friend.save()
            // post = new Post({description: body, owner: "req.user._id", pet: frompet})
            // await post.save()
        }else{
            frompet=req.selected_pet._id
        }
        // console.log("req.selected_pet._id => ",req.selected_pet._id)
        // console.log("pet.owner => ",pet.owner)
        // console.log("pet._id => ",pet._id)
        const notification = new Notification({ from: req.user._id, body,to: pet.owner, fromPet: frompet, toPet: pet._id, title, screenId,screenName});
        await notification.save();
        // console.log("post =>",post);
        if (user.fcmToken.length > 0) {
            await PushNotificationService.notifySingleDevice({
                title: title,
                body: body
            }, user.fcmToken, { _id: screenId.toString(),screenName,screenId:screenId.toString() });
        }
    } catch (error) {
        console.error(error);
    }
    // end push notification

}
exports.firebaseNotificationMultiUser = async (pet, req, title, body,  screenId,screenName) => {
    const normalizeFriend = await FriendsService.getMyFriendsOwnerforNotification(pet._id);
    const owners = normalizeFriend.map(p => p.owner);
    const petNames = normalizeFriend.map(p => p.name);
    const users = await User.find({ _id: { $in: owners } });
    const pets = await Pet.find({ name: { $in: petNames } })
    // console.log("normalizeFriend => ",normalizeFriend)
    // console.log("owners => ",owners)
    // console.log("users => ",users)
    // console.log("pets => ",pets)
    const fcmtokens = getListOfFcmTokenFromArray(users);
    // const insertMany = users.map((user) => {
    //     return { from: req.user._id, body,to: user._id, fromPet: req.selected_pet._id, toPet: user.selected_pet, title, screenId,screenName}
    // })
    const insertMany = pets.map((pet) => {
        return { from: req.user._id, body,to: pet.owner, fromPet: req.selected_pet._id, toPet: pet._id, title, screenId,screenName}
    })

    await Notification.insertMany(insertMany)
    if (fcmtokens.length > 0) {
        await PushNotificationService.notifyMultipleDevices({
            title: title,
            body: body
        }, fcmtokens, { _id: screenId.toString(), screenName,screenId:screenId.toString() });
    }
}


exports.firebaseNotificationMultiUserPanic = async (req, title, body, type, _id) => {
    const pets = await Pet.find({ _id: { $in: req.selected_pet.friends } })
    const owners = pets.map(p => p.owner);
    const users = await User.find({ _id: { $in: owners } })
    const fcmtokens = getListOfFcmTokenFromArray(users);
    const insertMany = users.map((user) => {
        return { from: req.user._id, to: user._id, fromPet: req.selected_pet._id, toPet: user.pet[0], title, body, type: type.toString(), moveId: _id.toString() }
    })
    await Notification.insertMany(insertMany)
    if (fcmtokens.length > 0) {
        await PushNotificationService.notifyMultipleDevices({
            title: title,
            body: body
        }, fcmtokens, { _id: _id.toString(), type: type.toString() });
    }
}
exports.AdminfirebaseNotificationMultiUser = async (req, title, body, type, screen) => {
    const users = await Admin.find({ active: true })
    const fcmtokens = getListOfFcmTokenFromArray(users);
    if (fcmtokens.length > 0) {
        await PushNotificationService.notifyMultipleDevices({
            title: title,
            body: body
        }, fcmtokens, { _id: req.selected_pet._id.toString(), type: '1', type });
    }
    // end push notification
    // Notification.insertMany for inserting notification to multiple users
    // const notification = new Notification({ from: req.user.pet, to: req.params.id, name: "FriendRequest" });
    // await notification.save();
}



const getListOfFcmTokenFromArray = (users) => {
    const fcmtokens = []
    users.forEach(user => {
        if (user.fcmToken.length > 0) {
            fcmtokens.push(user.fcmToken)
        }
    })
    return fcmtokens;
}