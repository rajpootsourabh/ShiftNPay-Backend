const mongoose = require("mongoose");

const moduleSchema = new mongoose.Schema({
  cat: { type: Number, required: true, unique: true }, // matches menuCategories
  pricePerMonth: { type: Number, required: true },
});

module.exports = mongoose.model("Module", moduleSchema);
