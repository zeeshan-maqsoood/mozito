  const router = require("express").Router();
  const Auth = require("./auth");
  const Post = require("./post")
  const Panic = require("./panic")
  const { requireGuestUserSignin } =require("../../middlewares/userAuth")
  
  router.use("/auth", Auth);
  router.use("/post",requireGuestUserSignin, Post);
  router.use("/panic",requireGuestUserSignin, Panic);
  
  module.exports = router;  