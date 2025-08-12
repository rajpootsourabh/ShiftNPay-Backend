const mongoose = require("mongoose");

const HolidaySchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
  name: { type: String, required: true },
  date: { type: Date, required: true },
  description: { type: String },
});

module.exports = mongoose.model("Holiday", HolidaySchema);
