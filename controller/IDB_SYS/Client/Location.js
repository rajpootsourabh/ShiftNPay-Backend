const Models = require('./../../../model/index');

// Get All Locations by Vendor with Pagination and Search
exports.getLocationsByVendor = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const query = {
      vendorId,
      ...(search && { location: { $regex: search, $options: 'i' } }),
    };

    const location = await Models.Location.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Models.Location.countDocuments(query);

    res.json({
      location,
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

// Get Single Location by ID
exports.getLocationById = async (req, res) => {
  try {
    const location = await Models.Location.findById(req.params.id);
    if (!location) return res.status(404).json({ message: 'Location not found' });
    res.json(location);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create New Location
exports.createLocation = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const newLocation = new Models.Location({
      vendorId,
      ...req.body,
    });

    await newLocation.save();
    res.status(201).json(newLocation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update Location by ID
exports.updateLocation = async (req, res) => {
  try {
    const location = await Models.Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!location) return res.status(404).json({ message: 'Location not found' });
    res.json(location);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete Location by ID
exports.deleteLocation = async (req, res) => {
  try {
    const location = await Models.Location.findByIdAndDelete(req.params.id);
    if (!location) return res.status(404).json({ message: 'Location not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
