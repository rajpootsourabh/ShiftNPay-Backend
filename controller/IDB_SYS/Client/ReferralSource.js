const ReferralSource = require("../../../model/IDB_SYS/Client/ReferralSource");
const { default: mongoose } = require("mongoose");

// Get all referral sources with pagination and search
const getReferralSources = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const vendorId = req.user._id;

    let query = { vendorId };

    // Add search functionality
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const referralSources = await ReferralSource.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await ReferralSource.countDocuments(query);

    res.json({
      data: referralSources,
      pagination: {
        total: count,
        pages: Math.ceil(count / limit),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching referral sources:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get single referral source by ID
const getReferralSourceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const referralSource = await ReferralSource.findById(id);

    if (!referralSource) {
      return res.status(404).json({ message: "Referral source not found" });
    }

    // Check if the referral source belongs to the vendor
    if (referralSource.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(referralSource);
  } catch (error) {
    console.error("Error fetching referral source:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create new referral source
const createReferralSource = async (req, res) => {
  try {
    const { name } = req.body;
    const vendorId = req.user._id;

    // Check if referral source with same name already exists for this vendor
    const existingReferralSource = await ReferralSource.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      vendorId
    });

    if (existingReferralSource) {
      return res.status(400).json({ message: "Referral source with this name already exists" });
    }

    const referralSource = new ReferralSource({
      name,
      vendorId
    });

    await referralSource.save();
    res.status(201).json(referralSource);
  } catch (error) {
    console.error("Error creating referral source:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Validation error", error: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update referral source
const updateReferralSource = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Check if referral source exists and belongs to vendor
    const existingReferralSource = await ReferralSource.findOne({
      _id: id,
      vendorId: req.user._id
    });

    if (!existingReferralSource) {
      return res.status(404).json({ message: "Referral source not found" });
    }

    // Check if another referral source with same name exists
    const duplicateReferralSource = await ReferralSource.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
      vendorId: req.user._id,
      _id: { $ne: id }
    });

    if (duplicateReferralSource) {
      return res.status(400).json({ message: "Another referral source with this name already exists" });
    }

    const updatedReferralSource = await ReferralSource.findByIdAndUpdate(
      id,
      { name },
      { new: true, runValidators: true }
    );

    res.json(updatedReferralSource);
  } catch (error) {
    console.error("Error updating referral source:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Validation error", error: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete referral source
const deleteReferralSource = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Check if referral source exists and belongs to vendor
    const referralSource = await ReferralSource.findOne({
      _id: id,
      vendorId: req.user._id
    });

    if (!referralSource) {
      return res.status(404).json({ message: "Referral source not found" });
    }

    await ReferralSource.findByIdAndDelete(id);
    res.json({ message: "Referral source deleted successfully" });
  } catch (error) {
    console.error("Error deleting referral source:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getReferralSources,
  getReferralSourceById,
  createReferralSource,
  updateReferralSource,
  deleteReferralSource
};