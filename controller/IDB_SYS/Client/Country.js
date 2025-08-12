const Models = require('./../../../model/index');

exports.getCountryByVendor = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const query = {
      vendorId,
      ...(search && {
        country: { $regex: search, $options: "i" },
      }),
    };

    const country = await Models.Country.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Models.Country.countDocuments(query);

    res.json({
      country,
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

exports.getCountryById = async (req, res) => {
  try {
    const country = await Models.Country.findById(req.params.id);
    if (!country) return res.status(404).json({ message: 'Note Type not found' });
    res.json(country);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createCountry = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { country } = req.body;


    const newCountry = new Models.Country({
      vendorId,
      country,
    });

    await newCountry.save();
    res.status(201).json(newCountry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateCountry = async (req, res) => {
  try {
    const country = await Models.Country.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!country) return res.status(404).json({ message: 'Note Type not found' });
    res.json(country);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteCountry = async (req, res) => {
  try {
    const country = await Models.Country.findByIdAndDelete(req.params.id);
    if (!country) return res.status(404).json({ message: 'Note Type not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
