var admin = require("firebase-admin");
var serviceAccount = require("../../config/mazito-a654c-firebase-adminsdk-mbcgo-164c84c751.json");

var admin = require("firebase-admin");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://mazito-a654c.firebaseio.com",
});

const messaging = admin.messaging();
var db = admin.database();
var firestore = admin.firestore();
exports.db=db;
exports.messaging = messaging;
exports.firestore = firestore;

