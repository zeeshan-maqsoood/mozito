const { isValidId } = require("../validator");

exports.idValidator = (req, res, next) => {
    if (isValidId(req.params.id)) {
        return next()
    }
    return next({ status: 422, msg: "ObjectId must be a single String of 12 bytes or a string of 24 hex characters" });
}
