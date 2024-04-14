const {
  Pet,
  Species,
  Post,
  Breed,
  User,
  Media,
  Friends,
} = require("../models");
const { PetValidator2 } = require("../validator/appValidation");
const SpeciesService = require("../service/species");
const BreedService = require("../service/breed");
const SpeciesTypeService = require("../service/speciesType");
const UserService = require("../service/user");
const friendsService = require("../service/friends");
const PetService = require("../service/pet");
const _ = require("lodash");
const mongoose = require("mongoose");
const { getAgeString, getAgeStringAsYear } = require("../utils");
const {
  firebaseNotificationUser,
} = require("../common/firebaseNotificationHelper");
exports.getAllSpecies = async (req, res, next) => {
  try {
    const species = await SpeciesService.getAllSpeciesForUser();
    return res
      .status(200)
      .json({ success: true, data: { species }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
};

exports.getAllBreeds = async (req, res, next) => {
  try {
    const {query} = req;
    const field=query.field || "species";
    const breeds = await BreedService.getAllBreedsForUser({
      [field]: req.params.id,
    });
    return res
      .status(200)
      .json({ success: true, data: { breeds }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
};

exports.getAllSpeciesType = async (req, res, next) => {
  try {
    const speciesType = await SpeciesTypeService.getAllSpeciesTypesForUser({
      species: req.params.id,
    });
    return res
      .status(200)
      .json({ success: true, data: { speciesType }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
};

exports.createPetProfile1 = async (req, res, next) => {
  console.log(req.body,"body")
  try {
    const { body } = req;
    const { mix } = body;
    const pet = PetService.newPetProfile1({ ...body });
    pet.owner = req.user._id;
    if (body.mix) {
      pet.isMixedBreed = true;
      pet.mix = mix;
      pet.breed = null;
    }
    if (
      body.speciesType &&
      body.speciesType !== null &&
      body.speciesType !== "null"
    ) {
      pet.speciesType = body.speciesType;
    } else {
      pet.speciesType = undefined;
    }
    pet.stage = 1;
    await pet.save();
    const petResponce = {
      gender: pet.gender,
      isMixedBreed: pet.isMixedBreed,
      mix: pet.mix,
      stage: pet.stage,
      status: pet.status,
      createdAt: pet.createdAt,
      _id: pet._id,
      stage: pet.stage,
      speciesType:pet.speciesType
    };
    return res.status(200).json({
      success: true,
      data: { pet: petResponce },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.updatePetProfile1 = async (req, res, next) => {
  try {
    const { body } = req;
    const { mix } = body;
    let pet = await PetService.getPetSimply({
      owner: req.user._id,
      _id: req.params.id,
    });
    if (!pet) return next({ status: 404, msg: "Pet not found" });
    // const pet = new Pet({ ...body });
    pet = _.extend(pet, req.body);
    if (mix) {
      pet.isMixedBreed = true;
      pet.mix = mix;
      pet.breed = null;
    } else {
      pet.mix = "";
      pet.isMixedBreed = false;
    }

    await pet.save();
    const petResponce = {
      gender: pet.gender,
      isMixedBreed: pet.isMixedBreed,
      mix: pet.mix,
      stage: pet.stage,
      status: pet.status,
      createdAt: pet.createdAt,
      _id: pet._id,
    };
    return res.status(200).json({
      success: true,
      data: { pet: petResponce },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};

exports.createAndUpdatePetProfile1 = async (req, res, next) => {
  try {
    const validationResult = await PetValidator2(req.body);
    if (validationResult) {
      return next({ status: 422, msg: validationResult });
    }
    let pet = await PetService.getPetSimply({
      owner: req.user._id,
      _id: req.params.id,
    });
    const user = await User.findById(pet.owner);
    const stage=pet.stage;
    if (!pet) return next({ status: 404, msg: "Pet not found" });
    pet = _.extend(pet, req.body);

    const { file } = req;
    let photo = {
      updatedAt: Date.now(),
    };
    if (file) {
      photo.key = file.key;
      photo.url = file.location;
      pet.photo = photo;
      const media = new Media({
        mimetype: file.mimetype,
        media: photo,
        pet: pet._id,
        owner: req.user._id,
        // geoLocation
      });
      await media.save();
    } else {
      if (!pet.photo.url) {
        return next({ status: 422, msg: "Photo must required" });
      }
    }
    pet.stage = 2;
    req.selected_pet=pet;
    user.selected_pet=pet._id;
    await user.save();
    // console.log("user=>",user);
    await pet.save();
    pet.__v = undefined;
    pet.pairingRequest = undefined;
    pet.pairing = undefined;
    pet.petBlock = undefined;
    pet.friends = undefined;
    pet.followers = undefined;
    pet.following = undefined;
    pet.friendRequest = undefined;
    pet.friendRequest = undefined;
    // let mz_pet={
    //   ...pet._doc.photo.url="https://petznpetz.s3.amazonaws.com/app/62875bce50fbe81d9f488d03/post/664e36e5-e675-43de-b2a2-883aaa3542c0",
    //   ...pet._doc
    //   // "pet.photo.url":"https://petznpetz.s3.amazonaws.com/app/62875bce50fbe81d9f488d03/post/664e36e5-e675-43de-b2a2-883aaa3542c0",
    // }
    // console.log("pet=>",mz_pet);
    if(stage==1){
      firebaseNotificationUser(
        pet,
        // mz_pet,
        req,
        // "Features Panic",
        // "Features Pairing",
        // "Features Schedule",
        // "Entertainment Blog",
        // "Community",
        "Welcome",
        // `Welcome to wonderful world of Mazito. Let's find friends.`,
        // "Hi Pet! Welcome into the wonderful world of Mazito! Get ready to build a community for all, Share your favorite moments and experiences, make new friends! Use your voice & claim your identity! We’re waiting for you! Just Mazito it!",
        "Hi Pet! Welcome into the wonderful world of Mazito! If you need anything i am right here to help you in any way I can!",
        // "Hi Pet! Did you know you can search and add new pet friends from our Friend feature? Click here (add friends feature link) and Chat with your best friend and make your next playdate! Mazito brings you closer to its loving community and allows you to really connect with hoomans and companions alike.",
        // "Hello Pet! Hop on to Mazito Blog page and enjoy new content every day! Click here (Add blog link) and enjoy!",
        // "Hi Pet! Did you know you can schedule your day, playtime and even medicine time! Click here (Add link) and start organizing!",
        // "Everyone deserves love! So if you are looking for love, you can find The One in Mazito! No more howling and whistling! Now you can send a polite bark, meow or chirp and you can get a chance to meet your bettar half! Click here (add link) and find the one now!",
        // "Hi Pet! Did you know you can alert our community for any kind of emergency for help and support? There is no panic in Mazito! If your friend get lost or hurt, everyone will know with just a boop of a button! So never panic or rescue any one in distress and be a hero for all! Click here (add link) and find out more!",
        "",
        "allrequestsview"
      );
    }
    return res
      .status(200)
      .json({ success: true, data: { pet }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
};

exports.getPetByUserId = async (req, res, next) => {
  try {
    // convert below code to aggregate

    const pets = await PetService.getPetsByUserId(req.params.id);
    return res
      .status(200)
      .json({ success: true, data: { pets }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
};
exports.getBlockedPet = async (req, res, next) => {
  try {
    const petBlocked = await Pet.findById(req.selected_pet._id)
      .populate("petBlock.pet", "name")
      .select("petBlock.name");
    const blockedPet = petBlocked.petBlock.map(({ pet }) => {
      return { _id: pet._id, name: pet.name };
    });
    return res.status(200).json({
      success: true,
      data: { blockedPet },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};
// not tested
exports.blockPetById = async (req, res, next) => {
  try {
    // const pet = await Pet.findById(req.user.pet);
    // if (req.params.id.toString() === req.user.pet.toString()) {
    //   return next({ status: 400, msg: "you cannot block yourself" });
    // }
    // if (!pet) return next({ status: 404, msg: "Pet not Found" });
    // const isBlocked = pet.petBlock.find(
    //   (u) => u.pet.toString() === req.params.id
    // );
    // if (isBlocked) {
    //   return next({ status: 409, msg: "you already blocked this pet" });
    // }
    // const isFriend = pet.friends.find(
    //   (friend) => friend.pet.toString() === req.params.id
    // );
    // if (isFriend) {
    //   pet.petBlock.push({ pet: req.params.id });
    //   await pet.save();
    //   return res.status(200).json({
    //     success: true,
    //     data: { msg: "Pet Blocked successfully" },
    //     msg: "ok",
    //     status: 200,
    //   });
    // } else {
    //   return next({ status: 404, msg: "Pet is not in your friend List" });
    // }

    // 5/16/2022

    const pet = await Pet.findById(req.user.selected_pet);
    // console.log("req.user.pet => ",pet)
    if (req.params.id.toString() === req.user.selected_pet.toString()) {
      return next({ status: 400, msg: "you cannot block yourself" });
    }
    if (!pet) return next({ status: 404, msg: "Pet not Found" });
    const isBlocked = pet.petBlock.find(
      (u) => u.pet.toString() === req.params.id.toString()
    );
    if (isBlocked) {
      return next({ status: 409, msg: "you already blocked this pet" });
    }
      pet.petBlock.push({ pet: req.params.id });
      await pet.save();
      return res.status(200).json({
        success: true,
        data: { msg: "Pet Blocked successfully" },
        msg: "ok",
        status: 200,
      });
  } catch (error) {
    return next(error);
  }
};

exports.unBlockPetById = async (req, res, next) => {
  try {
    // console.log("req.user => ",req.user)
    const pet = await Pet.findById(req.user.selected_pet);
    if (!pet) return next({ status: 404, msg: "pet not found" });
    const isBlocked = pet.petBlock.find(
      (u) => u.pet.toString() === req.params.id.toString()
    );
    if (isBlocked) {
      // pet.petBlock.pop({ pet: req.params.id });
      const UnBlocked=pet.petBlock.filter(e=>e.pet.toString()!==req.params.id.toString())
      pet.petBlock=UnBlocked
      // console.log("petBlock => ",UnBlocked)
    } else {
      return next({ status: 409, msg: "you have not blocked this pet" });
    }
    await pet.save();
    return res.status(200).json({
      success: true,
      data: { msg: "Pet UnBlocked successfully" },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    return next(error);
  }
};
exports.getMyPets = async (req, res, next) => {
  try {
    const pets = await PetService.getPetsByUserId(req.user._id);
    const mypets = pets.map((pet) => {
      const age = getAgeStringAsYear(pet.dob || new Date());
      return {
        ...pet,
        age,
        selected:
          pet._id.toString() === req.user.selected_pet._id.toString()
            ? true
            : false,
      };
    });
    return res
      .status(200)
      .json({ success: true, data: { pets: mypets }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
};
exports.getMyPetsForPanic = async (req, res, next) => {
  try {
    const pets = await PetService.getPetsForPanic(req.user._id);
    pets.push({ _id: null, name: "Other" });
    return res
      .status(200)
      .json({ success: true, data: { pets }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
};

exports.findNearByPet = async (req, res, next) => {
  try {
    let searchQuery = {
      geoLocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [
              Number(req.query.lng) || req.user.geoLocation.coordinates[0] || 0,
              Number(req.query.lat) || req.user.geoLocation.coordinates[1] || 0,
            ],
          },
          $maxDistance: Number(req.query.distance) || 5000,
          // $minDistance: 0
        },
      },
    };
    const { query } = req;
    if (query.distance) {
      searchQuery.geoLocation["$near"].$maxDistance = query.distance;
    }
    if (query.species) searchQuery.species = query.species;
    if (query.breed) searchQuery.breed = query.breed;
    if (query.mix) searchQuery.isMixedBreed = true;
    if (query.gender) searchQuery.gender = query.gender;
    if (query.status) searchQuery.status = query.status;
    // searchQuery.primary = true;
    const pets = await Pet.find(searchQuery)
      .populate("owner", "state city")
      .populate("breed", "name")
      .populate("species", "name");
    await Pet.populate(pets, {
      path: "owner",
      select: "city state",
      populate: [
        { path: "city", select: "name" },
        { path: "state", select: "name" },
      ],
    });

    return res
      .status(200)
      .json({ success: true, data: { pets }, msg: "ok", status: 200 });
  } catch (error) {
    return next(error);
  }
};

exports.selectPet = async (req, res, next) => {
  try {
    const pet = await PetService.getPetSimply({
      owner: req.user._id,
      _id: req.params.id,
    });
    if (!pet) return next({ status: 404, msg: "pet not found" });
    const user = await User.findById(req.user._id);
    if (!user) return next({ status: 404, msg: "User not found" });
    user.selected_pet = pet._id;
    await user.save();
    return res.status(200).json({
      success: true,
      data: { msg: "pet selected" },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

exports.getSinglePetById = async (req, res, next) => {
  try {
    const mypetId = req.selected_pet._id.toString();
    // const fixedFriend = await friendsService.getNormalizeFriend(
    //   "6156f131cff1a4b5e17a0460",
    //   "accepted"
    // );
    const normalizeFriends = await friendsService.getNormalizeFriend(
      mypetId,
      "accepted"
    );
    // const normalizeFriend = normalizeFriends.concat(fixedFriend)
    // console.log("normalizeFriend => ",normalizeFriend)
    const pet = await PetService.getPetById(req.params.id, normalizeFriends,mypetId);

    if (!pet.length) return next({ status: 404, msg: "pet not found" });
    let newpet = { ...pet[0] };
    newpet.age = getAgeStringAsYear(newpet.dob);
    let mutual = newpet.mutual.length>0?newpet.mutual:[]
    const mutualFriends = await PetService.getMutualPetFirends(mutual)
    // console.log("mutualFriends => ",mutualFriends)

    return res
      .status(200)
      .json({ success: true, data: { pet: newpet,mutualFriends }, msg: "ok", status: 200 });
  } catch (error) {
    next(error);
  }
};

exports.deletePetByID = async (req, res, next) => {
  try {
    const pet = await Pet.delete(
      { _id: req.params.id, owner: req.user._id },
      req.params.id
    );
    if (!pet) return next({ status: 404, msg: "pet not found" });
    return res.status(200).json({
      success: true,
      data: { msg: "Pet deleted" },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};

exports.getPetGallery = async (req, res, next) => {
  try {
    // const media = await Post.aggregate([
    //   {
    //     $match: {
    //       pet: mongoose.Types.ObjectId(req.selected_pet._id),
    //     },
    //   },
    //   {
    //     $project: {
    //       isVideo: "$content.isVideo",
    //       media: "$content.media",
    //       mimetype: "$content.mimetype",
    //       pet: 1,
    //       createdAt: 1,
    //     },
    //   },
    //   {
    //     $project: {
    //       "media.updatedAt": false,
    //     },
    //   },
    //   {
    //     $match: {
    //       "media.url": {
    //         $ne: "",
    //       },

    //       isVideo: false,
    //     },
    //   },
    // ]);
    // console.log("req.selected_pet._id => ",req.selected_pet._id)
    const media = await Media.find({ pet: req.selected_pet._id }).select(
      "-__v -owner -updatedAt"
    )
    .sort({createdAt:-1});
    return res.status(200).json({
      success: true,
      data: { media },
      msg: "ok",
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};
