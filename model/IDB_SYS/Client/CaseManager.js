const mongoose = require("mongoose");

const CaseManagerSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    Agency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    // Optional fields
    ext: { type: String, default: "" },
    phone2: { type: String, default: "" },
    fax: { type: String, default: "" },
    email: { type: String, unique: true, sparse: true, default: "" },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CaseManager", CaseManagerSchema);
