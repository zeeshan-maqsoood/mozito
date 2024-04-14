const {
  isEmpty,
  isIn,
  isValidId,
  minLength,
  validateEmail,
  isDate,
  IsIdExist,
  invalidEmailMsg,
} = require("./helper");
const isIdExist = new IsIdExist();
const status = 422;
const requriedMessage = (field) => `${field} is requried`;
const inValidIDMessage = (field) => `${field} does not have a valid ID`;

exports.reasonValidator = (req, res, next) => {
  try {
    const { body } = req;
    if (isEmpty(body.text))
      return next({ status, msg: "Reason text is required" });
    if (isEmpty(body.type))
      return next({ status, msg: "Reason Type is required" });
    if (!isIn(body.type, ["emergency", "lost", "found"]))
      return next({ status, msg: "Reason type must be lost/found/emergency" });
    return next();
  } catch (error) {
    return next(error);
  }
};

exports.speciesValidator = (req, res, next) => {
  try {
    const { body } = req;
    if (isEmpty(body.name)) return next({ status, msg: "Name is required" });

    return next();
  } catch (error) {
    return next(error);
  }
};

exports.postAndNotificationValidator = (req, res, next) => {
  try {
    const { body } = req;
    if (isEmpty(body.title)) return next({ status, msg: "Title is required" });
    if (isEmpty(body.body)) return next({ status, msg: "Body is required" });
    return next();
  } catch (error) {
    return next(error);
  }
};

exports.speciesTypeValidator = async (req, res, next) => {
  try {
    const { body } = req;
    if (isEmpty(body.name)) return next({ status, msg: "Name is required" });
    if (isEmpty(body.species))
      return next({ status, msg: requriedMessage("Species") });
    if (isValidId(body.species))
      return next({ status, msg: inValidIDMessage("Species") });
    if (!(await isIdExist.speciesId(body.species)))
      return next({ status, msg: "Invalid Species" });
    return next();
  } catch (error) {
    return next(error);
  }
};
exports.breedValidator = async (req, res, next) => {
  try {
    const { body } = req;
    if (isEmpty(body.name)) return next({ status, msg: "Name is required" });
    if (isEmpty(body.species))
      return next({ status, msg: requriedMessage("Species") });
    if (isValidId(body.species))
      return next({ status, msg: inValidIDMessage("Species") });
    if (!(await isIdExist.speciesId(body.species)))
      return next({ status, msg: "Invalid Species" });
    // console.log("speciesType => ",body.speciesType)
    body.speciesType==="null"||body.speciesType===null?body.speciesType = undefined:body.speciesType = body.speciesType
    // console.log("speciesType => ",body.speciesType)
    if (body.speciesType) {
      if (isValidId(body.speciesType))
        return next({ status, msg: inValidIDMessage("Species Type") });
      if (!(await isIdExist.speciesTypeId(body.speciesType)))
        return next({ status, msg: "Invalid Species Type" });
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

exports.breedValidatorUpdate = async (req, res, next) => {
  try {
    const { body } = req;
    if(body.name){
      if (isEmpty(body.name)) return next({ status, msg: "Name is required" });
    }
    if(body.species){
      if (isEmpty(body.species))
        return next({ status, msg: requriedMessage("Species") });
      if (isValidId(body.species))
        return next({ status, msg: inValidIDMessage("Species") });
      if (!(await isIdExist.speciesId(body.species)))
        return next({ status, msg: "Invalid Species" });
    }

    if (body.speciesType && body.speciesType !==null && body.speciesType !== "null") {
      if (isValidId(body.speciesType))
        return next({ status, msg: inValidIDMessage("Species Type") });
      if (!(await isIdExist.speciesTypeId(body.speciesType)))
        return next({ status, msg: "Invalid Species Type" });
    }
    return next();
  } catch (error) {
    return next(error);
  }
};
exports.speciesTypeValidatorUpdate = async (req, res, next) => {
  try {
    const { body } = req;
    if (body.name) {
      if (isEmpty(body.name)) return next({ status, msg: "Name is required" });
    }
    if (!isEmpty(body.species)) {
      if (isValidId(body.species))
        return next({ status, msg: inValidIDMessage("Species") });
      if (!(await isIdExist.speciesId(body.species)))
        return next({ status, msg: "Invalid Species" });
    }
    return next();
  } catch (error) {
    return next(error);
  }
};
