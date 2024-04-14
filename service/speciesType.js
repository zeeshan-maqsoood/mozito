const { SpeciesType } = require("../models");
const mongoose = require("mongoose");
class BreedService {
  constructor() {}
  static getAllSpeciesTypesForUser = (match) => {
    return SpeciesType.find(match)
    .select({ __v: false, addedBy: false,deleted:false })
    .sort("name");
  };
}
module.exports = BreedService;
