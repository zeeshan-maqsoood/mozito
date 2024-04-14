const { body } = require('express-validator');
const mongoose = require('mongoose');

const requireField = (name) => body(name).notEmpty().withMessage(`${name} must required`);
const isEmail = (email) => body(email).isEmail().withMessage("please provid valid email");
const isLength = (name, min) => body(name).isLength({ min }).withMessage(`${name} must be minimum ${min} characters`);

const isId = (id) => body(id).custom(value => this.isValidId(value)).withMessage(`${id} is not valid`);
const gender = (value) => body(value).isIn(["male", "female"]).withMessage("gender must be male or female");
const status = (value) => body(value).isIn(["single", "paired"]).withMessage("status must be single or paired");


exports.isValidId = (id) => {
    return mongoose.isValidObjectId(id);
};
exports.roleValidator = [
    requireField("name"),
    requireField("features")
];
exports.NameValidator = [
    requireField("name")
]
exports.petProfileValidator = [
    requireField("name"),
    requireField("status"),
    status("status"),
    requireField("gender"),
    gender("gender"),
    requireField("breed"),
    isId("breed"),
    requireField("species"),
    isId("species"),
    requireField("color"),
    isId("color")
];
exports.faqValidator = [
    requireField("question"),
    requireField("answer"),

];
exports.adminValidator = [
    requireField("email"),
    isEmail("email"),
    requireField("username"),
    requireField("password"),
    // body("password").isLength({ min: 6 }).withMessage("password must be grather than 5 characters"),
    requireField("role"),
    // isId("role")
]
exports.adminValidatorSingin = [
    requireField("email"),
    requireField("password")
]
exports.updateRoleValidator = [
    requireField("role"),
    isId("role")
]
exports.stateValidator = [
    requireField("name"),
    requireField("country"),
    isId("country")
]
exports.cityValidator = [
    requireField("name"),
    requireField("state"),
    isId("state")
]
exports.breedValidator = [
    requireField("name"),
    requireField("species"),
    isId("species")
]
exports.categoryValidator = [
    requireField("category"),
    isId("category"),
]
exports.LostPetValidatorOther = [
    requireField("pet"),
    requireField("owner.name"),
    requireField("lastSeen"),
    requireField("state"),
    isId("state"),
    requireField("city"),
    isId("city"),
    requireField("location"),
    requireField("detail"),
    requireField("color"),
    isId("color")
];