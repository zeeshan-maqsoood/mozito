const router = require("express").Router();
const { Notification } = require("../../models");
const { idValidator } = require("../../middlewares");
const mongoose = require("mongoose");
const {
  firebaseNotificationUser,
} = require("../../common/firebaseNotificationHelper");
const notificationMessages = require("../../common/notificationMessages");
const {SendPairingRequest,receivedPairingReq, sentPairingRequest, pairingRequestAccept, pairingRequestReject, pairingRequestCancle,pairingUnpaired}= require("../../controller/pairing")

// create pairing request
router.param("id", idValidator);

// ok-hyf
// id=petId
router.post("/sendPairingRequest/:id",SendPairingRequest);
// ok-hyf
// all pairing request receive
router.get("/request/receive", receivedPairingReq);

// ok-hyf
// all request sent
router.get("/request/sent", sentPairingRequest);
// ok-hyf
// pairing  accept request (pairing id)
router.put("/requestAccept/:id", pairingRequestAccept);

// pairing Reject request (pairing id)
router.delete("/requestReject/:id", pairingRequestReject);

// unpair
router.put("/unpair/:id", pairingUnpaired)

// pairing cancel request
router.put("/requestcancel/:id", pairingRequestCancle);

module.exports = router;
