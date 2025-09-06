const Models = require("./../../../model/index"); // Make sure Physician is exported from your index.js

// GET all physician with pagination + search
exports.getPhysician = async (req, res) => {
  try {
    const vendorId = req.user._id; // assuming physician is linked to vendor
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const query = {
      vendorId,
      ...(search && {
        name: { $regex: search, $options: "i" },
      }),
    };

    const physician = await Models.Physician.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Models.Physician.countDocuments(query);

    res.json({
      physician,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET physician by ID
exports.getPhysicianById = async (req, res) => {
  try {
    const physician = await Models.Physician.findById(req.params.id);
    if (!physician)
      return res.status(404).json({ message: "Physician not found" });
    res.json(physician);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE physician
exports.createPhysician = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const physicianData = { ...req.body, vendorId };

    const newPhysician = new Models.Physician(physicianData);
    await newPhysician.save();

    res.status(201).json(newPhysician);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// UPDATE physician
exports.updatePhysician = async (req, res) => {
  try {
    const physician = await Models.Physician.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!physician)
      return res.status(404).json({ message: "Physician not found" });
    res.json(physician);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE physician
exports.deletePhysician = async (req, res) => {
  try {
    const physician = await Models.Physician.findByIdAndDelete(req.params.id);
    if (!physician)
      return res.status(404).json({ message: "Physician not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
