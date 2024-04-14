const router = require("express").Router();
const { guestUserSignUpValidator, guestUserSigninValidator } = require("../../validator/appValidation")
const { requireGuestUserSignin } = require("../../middlewares/userAuth")
const { signupForGuestUser, singinForGuestUser, guestUserLogout } = require("../../controller/auth")

router.post("/signup",guestUserSignUpValidator,signupForGuestUser);
router.post("/logout",requireGuestUserSignin,guestUserLogout)
// router.post("/signin", guestUserSigninValidator, singinForGuestUser);

module.exports = router;