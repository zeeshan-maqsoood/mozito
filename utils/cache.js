const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 0, checkperiod: 0, deleteOnExpire: true });
module.exports = myCache;