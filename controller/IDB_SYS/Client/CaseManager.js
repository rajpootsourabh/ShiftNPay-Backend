const Models = require('./../../../model/index');

// GET all CaseManagers by Vendor with pagination and optional search
exports.getCaseManagerByVendor = async (req, res) => {
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
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }),
    };

    const data = await Models.CaseManager.find(query)
      .populate('Agency')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Models.CaseManager.countDocuments(query);

    res.json({
      data,
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

// GET CaseManager by ID
exports.getCaseManagerById = async (req, res) => {
  try {
    const data = await Models.CaseManager.findById(req.params.id).populate('Agency');
    if (!data) return res.status(404).json({ message: 'CaseManager not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE a new CaseManager
exports.createCaseManager = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const {
      Agency,
      firstName,
      lastName,
      phone,
      ext,
      phone2,
      fax,
      email,
      status
    } = req.body;

    const newCaseManager = new Models.CaseManager({
      vendorId,
      Agency,
      firstName,
      lastName,
      phone,
      ext,
      phone2,
      fax,
      email,
      status,
    });

    await newCaseManager.save();
    res.status(201).json(newCaseManager);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// UPDATE CaseManager
exports.updateCaseManager = async (req, res) => {
  try {
    const data = await Models.CaseManager.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!data) return res.status(404).json({ message: 'CaseManager not found' });
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE CaseManager
exports.deleteCaseManager = async (req, res) => {
  try {
    const data = await Models.CaseManager.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ message: 'CaseManager not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
