const router = require("express").Router();
const log4js = require("log4js");
const {
  requireSigninUser,
  requireSigninUserParams,
  requireSigninUserByBody,
} = require("../../middlewares/userAuth");
const { idValidator } = require("../../middlewares");
const {
  User,
  Pet,
  UserDelete,
  Notification,
  Meal,
  Medication,
  Play,
  LostPet,
  LostPetOther,
  EmergencyAlert,
  PetFound,
  Paring,
  Album,
} = require("../../models");
let { s3, upload, local } = require("../../s3");
const Upload = upload("app/user");
local = local("app/user");
const AccountRecovery = require("../../models/AccountRRecoveryRequest");
const {
  signUpValidator,
  signinValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  recoverPasswordValidator,
  recoverAccountValidator,
  CreateProfileValidator,
  recoverAccountFormValidator,
} = require("../../validator/appValidation");
const {
  signupForUser,
  singinForUser,
  createProfileForUser,
  changePasswordForUser,
  forgotPasswordForUser,
  resetPasswordForUser,
  getUser,
  resendEmailForUser,
  verifyEmailForUser,
  logout,
  deleteUser,
  testing
} = require("../../controller/auth");

const logger = log4js.getLogger("User.js");
logger.level = "all";

router.param("id", idValidator);
// test cases
// 1. both email and password is required.
// 2. email must be valid.
// 3. email must be unique.
// 4. password grather than 6 character.
// 5. if success then send varification email to user mail.
router.post("/signup", signUpValidator, signupForUser);
router.post("/logout",requireSigninUser,logout)

// tested
// when user signin please check if user is verify if user is verified then login successfully other verfication email is send to user email
// test cases
// 1.both email and password is required.
// 2.email must be valid.
// 3.if success and email is unverified then verification email send to user mail.
// 4. if success and email is verified then user login successfully.
router.post("/signin", signinValidator, singinForUser);
router.post("/test",testing)
// tested
// in future if we want to add owner then the code of that photo is commented and also change code to s3 file
// test cases
// 1. token required.
// 2. multiple field required.
// 3. secondary email is unique and valid.
router.put(
  "/createProfile",
  requireSigninUser,
  CreateProfileValidator,
  createProfileForUser
);

// tested
// test cases
// 1. token required.
// 2. old and new password is required.
// 3. new password should be grather than 6 character. 
router.put(
  "/changePassword",
  requireSigninUser,
  changePasswordValidator,
  changePasswordForUser
);

// tested
// dynamic link
// forgot password step#1

// test cases
// 1.email/secondaryEmail required and valid.
// 2.if email exist in dataase then mail is sent to user mail.
router.post(
  "/forgotPassword",
  forgotPasswordValidator,
  forgotPasswordForUser
);

// tested
// forgot password step#2
// in this step user copy password from mail and send it using below api

// test cases
// 1. in body password, email, and token is required.
// 2. token must be valid.
router.put(
  "/resetPassword",
  requireSigninUserByBody,
  recoverPasswordValidator,
  resetPasswordForUser
);

// tested
// id=user.id

// test cases.
// 1. token required.
router.get("/user", requireSigninUser,getUser );

// tested
router.delete("/:id", requireSigninUser, deleteUser);


// tested

// test cases
// 1. email is required in params.
// 2. email must exists in DB.
router.get("/resendVerificationMail/:email",resendEmailForUser );

// user hit below api. if token is valid then redirect to dynamic link
// after signin/signup and genrate dynamic link

// 1. token in query params required.
// 2. token must be valid.
router.get("/verifyEmail", requireSigninUserParams,verifyEmailForUser );

module.exports = router;
