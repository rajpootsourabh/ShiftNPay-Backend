const Models = require("./../../../model/index");

// GET all payor with pagination + search
exports.getPayor = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const query = {
      vendorId,
      ...(search && {
        $or: [
          { payor: { $regex: search, $options: "i" } },
          { payorId: { $regex: search, $options: "i" } },
          { 'edi.receiverName': { $regex: search, $options: "i" } }
        ]
      }),
    };

    const payor = await Models.Payor.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Models.Payor.countDocuments(query);

    res.json({
      payor,
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

// GET payor by ID
exports.getPayorById = async (req, res) => {
  try {
    const payor = await Models.Payor.findById(req.params.id);
    if (!payor)
      return res.status(404).json({ message: "Payor not found" });
    res.json(payor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE payor
exports.createPayor = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const payorData = { 
      ...req.body, 
      vendorId,
      // Initialize nested objects if they're not provided
      edi: req.body.edi || {},
      options: req.body.options || {},
      callProcessing: req.body.callProcessing || {}
    };

    const newPayor = new Models.Payor(payorData);
    await newPayor.save();

    res.status(201).json(newPayor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// UPDATE payor
exports.updatePayor = async (req, res) => {
  try {
    const updateData = { $set: {} };

    // flatten edi
    if (req.body.edi) {
      Object.keys(req.body.edi).forEach(key => {
        updateData.$set[`edi.${key}`] = req.body.edi[key];
      });
    }

    // flatten options
    if (req.body.options) {
      Object.keys(req.body.options).forEach(key => {
        updateData.$set[`options.${key}`] = req.body.options[key];
      });
    }

    // flatten callProcessing
    if (req.body.callProcessing) {
      Object.keys(req.body.callProcessing).forEach(key => {
        updateData.$set[`callProcessing.${key}`] = req.body.callProcessing[key];
      });
    }

    // handle other top-level fields (not nested ones)
    Object.keys(req.body).forEach(key => {
      if (!["edi", "options", "callProcessing"].includes(key)) {
        updateData.$set[key] = req.body[key];
      }
    });

    const payor = await Models.Payor.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!payor) {
      return res.status(404).json({ message: "Payor not found" });
    }

    res.json(payor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE payor
exports.deletePayor = async (req, res) => {
  try {
    const payor = await Models.Payor.findByIdAndDelete(req.params.id);
    if (!payor)
      return res.status(404).json({ message: "Payor not found" });
    res.json({ message: "Payor deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Additional controller for payor status update
exports.updatePayorStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const payor = await Models.Payor.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!payor)
      return res.status(404).json({ message: "Payor not found" });
    res.json(payor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};