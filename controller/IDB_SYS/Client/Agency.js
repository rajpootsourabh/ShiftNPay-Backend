const Models = require('./../../../model/index')

exports.getAgenciesByVendor = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || "";

    // Build query with search
    const query = {
      vendorId,
      ...(search && {
        $or: [
          { agency: { $regex: search, $options: "i" } },
          { address_1: { $regex: search, $options: "i" } },
          { address_2: { $regex: search, $options: "i" } },
          { city: { $regex: search, $options: "i" } },
          { state: { $regex: search, $options: "i" } },
          { zip: { $regex: search, $options: "i" } },
        ],
      }),
    };

    const agencies = await Models.AgencyModel.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Models.AgencyModel.countDocuments(query);

    res.json({
      agencies,
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



exports.getAgencyById = async (req, res) => {
  try {
    const agency = await Models.AgencyModel.findById(req.params.id);
    if (!agency) return res.status(404).json({ message: 'Agency not found' });
    res.json(agency);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createAgency = async (req, res) => {
  try {
    const vendorId = req.user._id;
    console.log(vendorId)
    const { agency, address_1, address_2, city, state, zip } = req.body;

    const newAgency = new Models.AgencyModel({
      vendorId,   // mapped to vendorId field in schema
      agency,
      address_1,
      address_2,
      city,
      state,
      zip,
    });

    await newAgency.save();
    res.status(201).json(newAgency);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateAgency = async (req, res) => {
  try {
    const agency = await Models.AgencyModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!agency) return res.status(404).json({ message: 'Agency not found' });
    res.json(agency);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteAgency = async (req, res) => {
  try {
    const agency = await Models.AgencyModel.findByIdAndDelete(req.params.id);
    if (!agency) return res.status(404).json({ message: 'Agency not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
