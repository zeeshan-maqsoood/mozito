const { Breed } = require("../models");
const mongoose = require("mongoose");
class BreedService {
  constructor() {}
  static getAllBreedsForUser = (match) => {
    return Breed.find(match)
    .select({ __v: false, addedBy: false,deleted:false })
    .sort("name");
  };
}
module.exports = BreedService;
