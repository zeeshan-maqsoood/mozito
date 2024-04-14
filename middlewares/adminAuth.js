const { validationResult } = require("express-validator");
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { Admin, Blog, State, City, Country, Color, Species, Breed, Faq, Interest } = require("../models");
exports.isAdmin = (req, res, next) => {
    if (req.user.role.name === "admin" || req.user.role.name === "super admin") {
        return next();
    }
    return next({ status: 401, msg: "Unauthorized to perform this action" })
}
exports.isSuperAdmin = (req, res, next) => {
    if (req.user.role.name === "super admin") {
        return next();
    }
    return next({ status: 401, msg: "Unauthorized to perform this action" })
}
exports.requireSignin = (req, res, next) => {
    const token = req.headers.authorization ? req.headers.authorization.split(" ")[1] : "";
    if (!token) {
        return next({ status: 401, msg: "Unauthorized" })
    }
    jwt.verify(token, process.env.JWT_SECRET_ADMIN, async (err, decode) => {
        if (!decode) {
            return next({ status: 401, msg: "Invalid Token" })
        }
        else {
            const user = await Admin.findById(decode._id)
            .select({
                password: false,
                __v: false
            })
            .populate("role", "features name");
            if (!user) {
                return next({ status: 404, msg: "Unauthorized" })
            }
            // console.log("user => ",user)
            req.user = user
            return next();
        }
    });
}

exports.havePermissionOFCrud = async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next({ status: 400, errors: errors.mapped(), msg: "Validation Failed" })
    }
    const user = req.user;

    if (!user) {
        return next({ status: 401, msg: "Unauthorized to perform this action" });
    }
    else if ((req.user.role.name === "super admin" || req.user.role.name === "admin") && req.user.active === true) {
        return next();
    }
    else {
        return next({ status: 401, msg: "Unauthorized to perform this action" });

    }
}

exports.isPoster = async (req, res, next) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return next({ status: 404, msg: "blog not found" })
        }
        else {
            if ((req.user.role.name === "super admin" || req.user.role.name === "admin") && req.user.active === true) {
                return next()
            }
            // if (blog._id.toString() === blog.createdBy.toString()) {
            // blog._id ko replace ker k req.user._id

            if (req.user._id.toString() === blog.createdBy.toString()) {
                return next()
            }
            else {
                return next({ status: 401, msg: "Unauthorized to perform this action" })
            }
        }

    } catch (error) {
        return next(error);
    }
}

exports.isCountryAdder = async (req, res, next) => {
    try {
        const country = await Country.findById(req.params.id);
        if (!country) return next({ status: 404, msg: "country not found" })
        if (country.addedBy.toString() === req.user._id) {
            return next();
        }
        else if ((req.user.role.name === "super admin" || req.user.role.name === "admin") && req.user.active === true) {
            return next();
        }
        else {
            return next({ status: 401, msg: "Unauthorized to perform this action" })
        }

    } catch (error) {
        return next(error);
    }
}
exports.isStateAdder = async (req, res, next) => {
    try {
        const state = await State.findById(req.params.id);
        if (!state) return next({ status: 404, msg: "state not found" })
        if (state.addedBy.toString() === req.user._id) {
            return next();
        }
        else if ((req.user.role.name === "super admin" || req.user.role.name === "admin") && req.user.active === true) {
            return next();
        }
        else {
            return next({ status: 401, msg: "Unauthorized to perform this action" })
        }

    } catch (error) {
        return next(error);
    }
}

exports.isCityAdder = async (req, res, next) => {
    try {
        const city = await City.findById(req.params.id);
        if (!city) return next({ status: 404, msg: "city not found" })
        if (city.addedBy.toString() === req.user._id) {
            return next();
        }
        else if ((req.user.role.name === "super admin" || req.user.role.name === "admin") && req.user.active === true) {
            return next();
        }
        else {
            return next({ status: 401, msg: "Unauthorized to perform this action" })
        }

    } catch (error) {
        return next(error);
    }

}
exports.isColorAdder = async (req, res, next) => {
    try {
        const color = await Color.findById(req.params.id);
        if (!color) return next({ status: 404, msg: "color not found" })
        if (color.addedBy.toString() === req.user._id.toString()) {
            return next();
        }
        else if ((req.user.role.name === "super admin" || req.user.role.name === "admin") && req.user.active === true) {
            return next();
        }
        else {
            return next({ status: 401, msg: "Unauthorized to perform this action" })
        }

    } catch (error) {
        return next(error);
    }
}

exports.isSpeciousAdder = async (req, res, next) => {
    try {
        const species = await Species.findById(req.params.id);
        if (!species) return next({ status: 404, msg: "species not found" })
        if (species.addedBy.toString() === req.user._id.toString()) {
            return next();
        }
        else if ((req.user.role.name === "super admin" || req.user.role.name === "admin") && req.user.active === true) {
            return next();
        }
        else {
            return next({ status: 401, msg: "unauthorized to perform this action" })
        }
    } catch (error) {
        return next(error);
    }
}
exports.isInterestAdder = async (req, res, next) => {
    try {
        const interest = await Interest.findById(req.params.id);
        if (!interest) return next({ status: 404, msg: "interest not found" })
        if (interest.addedBy.toString() === req.user._id.toString()) {
            return next();
        }
        else if ((req.user.role.name === "super admin" || req.user.role.name === "admin") && req.user.active === true) {
            return next();
        }
        else {
            return next({ status: 401, msg: "unauthorized to perform this action" })
        }

    } catch (error) {
        return next(error);
    }
}

exports.isBreedAdder = async (req, res, next) => {
    try {
        const breed = await Breed.findById(req.params.id);
        if (!breed) return next({ status: 404, msg: "breed not found" })
        if (breed.addedBy.toString() === req.user._id.toString()) {
            return next();
        }
        else if ((req.user.role.name === "super admin" || req.user.role.name === "admin") && req.user.active === true) {
            return next();
        }
        else {
            return next({ status: 401, msg: "unauthorized to perform this action" })
        }

    } catch (error) {
        return next(error);
    }
}
exports.isFaqAdder = async (req, res, next) => {
    try {
        const faq = await Faq.findById(req.params.id);
        if (!faq) return next({ status: 404, msg: "faq not found" })
        if (faq.createdBy.toString() === req.user._id.toString()) {
            return next();
        }
        else if ((req.user.role.name === "super admin" || req.user.role.name === "admin") && req.user.active === true) {
            return next();
        }
        else {
            return next({ status: 401, msg: "unauthorized to perform this action" })
        }

    } catch (error) {
        return next(error);
    }
}