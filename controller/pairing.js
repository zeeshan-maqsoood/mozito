const { firebaseNotificationUser } = require("../common/firebaseNotificationHelper");
const { Pairing, Pet } = require("../models");
const FriendsService = require("../service/friends");
const PairingService = require("../service/pairing");
const PetService = require("../service/pet");
const notificationMessages = require("../common/notificationMessages");

exports.SendPairingRequest = async (req, res, next) => {
  try {
    if (req.selected_pet._id.toString() === req.params.id)
      return next({
        status: 409,
        msg: "You cannot send pairing request to yourself",
      });
    const toPet = await Pet.findById(req.params.id);
    if (!toPet) return next({ status: 404, msg: "Receiver not found" });

    if (toPet.gender === req.selected_pet.gender)
      return next({
        status: 405,
        msg: "you cannot send pairing request to same gender",
      });
    if (toPet.species.toString() !== req.selected_pet.species.toString())
      return next({
        status: 405,
        msg: "you cannot send pairing request to different species",
      });
    const toBreed = toPet.breed !== null ? toPet.breed.toString() : "";
    const myBreed =
      req.selected_pet.breed !== null ? req.selected_pet.breed.toString() : "";
    if (myBreed !== toBreed)
      return next({
        status: 405,
        msg: "you cannot send pairing request to different breed",
      });

    const pairing = new Pairing({ to: toPet._id, from: req.selected_pet._id });
    await pairing.save();
    firebaseNotificationUser(
      {owner:toPet.owner},
      req,
      notificationMessages.createPpairingRequestTitle(req.selected_pet.name),
      notificationMessages.createPairingRequestBody(req.selected_pet.name),
      // `${req.selected_pet.name} sent you pairing request`,
      // `${pairing.description}`,
      pairing._id,
      // "pairingDetail"
      "allrequestsview"
    );

    return res.status(200).json({
      success: true,
      data: { msg: "Pairing request sent" },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.receivedPairingReq = async (req, res, next) => {
  try {
    const mypetId = req.selected_pet._id.toString();
    const normalizeFriend = await FriendsService.getNormalizeFriend(
      mypetId,
      "accepted"
    );
    const pairing = await PairingService.getPairingRequestReceive(
      mypetId,
      normalizeFriend
    );
    if (!pairing.length)
      return next({ status: 404, msg: "No Paring Request Found" });
    return res.status(200).json({
      success: true,
      data: { pairing: pairing },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.sentPairingRequest = async (req, res, next) => {
  try {
    const mypetId = req.selected_pet._id.toString();
    const normalizeFriend = await FriendsService.getNormalizeFriend(
      mypetId,
      "accepted"
    );
    const pairing = await PairingService.getPairingRequstSent(
      mypetId,
      normalizeFriend
    );
    if (!pairing.length)
      return next({ status: 404, msg: "No Paring Request sent Found" });
    return res.status(200).json({
      success: true,
      data: { pairing: pairing },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.pairingRequestAccept = async (req, res, next) => {
  try {
    // const socketUser = req.app.io.nsps["/user"];
    const pairing = await PairingService.getPairing({
      _id: req.params.id,
      to: req.selected_pet._id,
    });
    if (!pairing) return next({ status: 404, msg: "pairing not found" });
    pairing.paringStatus = "accepted";
    
    await pairing.save();

    await Pet.populate(pairing, { path: "from", select: "owner" }),
    firebaseNotificationUser(
      {owner:pairing.from.owner},
      req,
      notificationMessages.pairingRequestAcceptTitle(req.selected_pet.name),
      notificationMessages.pairingRequestAcceptBody(req.selected_pet.name),
      // `${req.selected_pet.name} accepted your pairing request`,
      // `${pairing.description}`,
      pairing._id,
      "pairingDetail"
    );
    return res.status(200).json({
      success: true,
      data: { msg: "Paring Accepted" },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.pairingRequestReject = async (req, res, next) => {
  try {
    const pairing = await PairingService.getPairing({
      _id: req.params.id,
      to: req.selected_pet._id,
    });
    if (!pairing) return next({ status: 404, msg: "pairing not found" });
    pairing.paringStatus = "rejected";
    await pairing.save();
    const pet=await PetService.getPetSimply({_id:pairing.from});
    if(!pet) return next({status:404,msg:"pet not found"});
    firebaseNotificationUser(
      pet,
      req,
      `${req.selected_pet.name} Reject Your Pairing Request`,
      "",
      req.params.id,
      "Pairing"
    );
    return res.status(200).json({
      success: true,
      data: { msg: "pairing rejected" },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.pairingUnpaired = async (req, res, next) => {
  try {
    const pairing = await PairingService.getPairing({
      _id: req.params.id,
      $or: [{ to: req.selected_pet._id }, { from: req.selected_pet._id }],
      paringStatus:"accepted"
    });
    if (!pairing) return next({ status: 404, msg: "pairing not found" });
    pairing.paringStatus = "unpaired";
    await pairing.save();
    // firebaseNotificationUser(
    //   { owner: pairing.from },
    //   req,
    //   notificationMessages.pairingRequestRejectTitle(req.selected_pet.name),
    //   pairing.description,
    //   "115",
    //   pairing._id.toString()
    // );
    return res.status(200).json({
      success: true,
      data: { msg: "pairing unpaired" },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.pairingRequestCancle = async (req, res, next) => {
  try {
    const pairing = await PairingService.getPairing({
      _id: req.params.id,
      from: req.selected_pet._id,
    });
    if (!pairing) return next({ status: 404, msg: "pairing not found" });
    pairing.paringStatus = "canceled";
    await pairing.save();
    return res.status(200).json({
      success: true,
      data: { msg: "Paring request canceled" },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};
