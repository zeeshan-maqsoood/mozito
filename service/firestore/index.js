const { isEqual } = require("lodash");
const {firestore} = require("../../service/firebase");

var UserRef=firestore.collection('users');

class FirestoreService{
    static addUserToFirease=async (id,data)=>{
        try {
            const res= await UserRef.doc(id).set({
                ...data,
            },{ merge: true });
            return res;
        } catch (error) {
            console.error("FCM error",error);
        }
    }
    static logoutUserToFirease=async (id,data)=>{
        try {
            const res= await UserRef.where('ownerId','==',id).get();
            res.forEach(async (doc)=>{ await UserRef.doc(doc.id).set({
                'fcmToken':''
            },{ merge: true });});
           
            return res;
        } catch (error) {
            console.error("FCM error",error);
        }
    }
}
module.exports = FirestoreService;