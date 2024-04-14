const router = require("express").Router();

const notificationMessages = require("../../common/notificationMessages");

const { idValidator } = require("../../middlewares");
const {
  closeAlert,
} = require("../../validator/appValidation");

const {
  firebaseNotificationMultiUserPanic,
} = require("../../common/firebaseNotificationHelper");

const {createPanicAlert,getPanics, getMyPanics, getSinglePanic,closeAlertController, updatePanic, getAlert, alertDismiss}= require("../../controller/panic")
let { s3, upload, local } = require("../../s3");
let Upload;
router.param("id", idValidator);

Upload = upload("app/panic");
// Upload = local("app/panic");
function getAgeString(dateString) {
  var today = new Date();
  var birthDate = new Date(dateString);
  var age = today.getFullYear() - birthDate.getFullYear();
  var m = today.getMonth() - birthDate.getMonth();
  age = age * 12 + m;
  const years = Math.floor(age / 12);
  const month = Math.round(Math.abs((years - age / 12) * 12));
  // return age;

  return `${years ? years + " years" : ""} ${month ? month + " month" : ""}`;
}

// ok-hyf
router.post(
  ["/createAlert", "/"],
  Upload.array("images"),
  // Upload.array("photos",12),
  createPanicAlert
);
// ok-hyf
router.get("/",getPanics);
// ok-hyf
router.get("/my",getMyPanics );


// ok-hyf
// router.route("/:id",getSinglePanic);
Upload = upload("app/panicupdate");
router.get("/alert",getAlert)
router.put("/alertDismiss",alertDismiss)
router.route("/:id")
  .get(getSinglePanic)
  .put(Upload.array("images"),updatePanic)

router.put("/close/:id", closeAlert, closeAlertController);

module.exports = router;
