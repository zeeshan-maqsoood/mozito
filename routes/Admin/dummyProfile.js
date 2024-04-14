const router = require("express").Router();
const { validationResult } = require("express-validator");
const { User, Pet } = require("../../models")
const _ = require("lodash");
let { s3, upload, local } = require("../../s3");
const { idValidator } = require("../../middlewares");
const Upload = upload("app/dummy");
local = local("app/dummy");


router.param("id", idValidator)
router.post("/create", Upload.single("photo"), async (req, res, next) => {
    try {
        const { file } = req
        let photo = {
            updatedAt: Date.now()
        }
        if (file) {
            photo.key = file.key;
            photo.url = file.location;
        } else {
            return next({ status: 422, errors: { photo: { msg: "photo must required" } }, msg: "Validation Failed" })
        }
        const { mix } = req.body;
        let newUser;
        newUser = await User.findOne({ email: req.body.user.email });
        if (newUser) return next({ status: 404, msg: "user already created" })
        newUser = new User({ ...req.body.user, primary: true, isdummy: true });
        const newPet = new Pet({ ...req.body.pet, owner: newUser._id, isdummy: true, photo });
        if (mix) {
            newPet.breed = null;
            newPet.isMixedBreed = true
            newPet.mix = mix;
        }
        else {
            newPet.isMixedBreed = false;
            newPet.mix = ""
        }
        newUser.pet.push(newPet._id)
        await newUser.save();
        await newPet.save();
        return res.status(200).json({ success: true, data: { user: newUser, pet: newPet }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});

router.get("/all", async (req, res, next) => {
    try {
        const query = RegExp(req.query.search || "", "i")
        let profiles = await User.find({ name: query, email: query, isdummy: true })
            .populate({
                model: "Pet",
                path: "pet",
                populate: [
                    { model: "Species", path: "species", select: "name" },
                    { model: "Breed", path: "breed", select: "name" },
                    { model: "Color", path: "color", select: "name" },
                    { model: "Interest", path: "interest", select: "name" }
                ]
            })
            .populate("country", "name")
            .populate("state", "name")
            .populate("city", "name");
        return res.status(200).json({ success: true, data: { users: profiles }, msg: "ok", status: 200 });
    } catch (error) {
        return next(error);
    }
});

router.route("/:id")
    .get(async (req, res, next) => {
        try {
            const user = await User.findById({ _id: req.params.id, isdummy: true })
                .populate("country", "name")
                .populate("state", "name")
                .populate("city", "name")
            if (!user) return next({ status: 404, msg: "Profile not found" });
            const pet = await Pet.findOne({ owner: user._id })
                .populate("breed", "name")
                .populate("species", "name")
                .populate("color", "name")
                .populate("interest", "name")
            user.pet = pet;
            return res.status(200).json({ success: true, data: { user: { ...user._doc, pet } }, msg: "ok", status: 200 });
        } catch (error) {
            return next(error);
        }
    })
    .delete(async (req, res, next) => {
        try {
            const user = await User.findOne({ _id: req.params.id, isdummy: true });
            if (!user) return next({ status: 404, msg: "Profile not found" });
            await Pet.deleteMany({ owner: req.params.id });
            await user.remove();
            return res.status(200).json({ success: true, data: { msg: "Profile Deleted" }, msg: "ok", status: 200 });
        } catch (error) {
            return next(error);
        }
    });

module.exports = router;