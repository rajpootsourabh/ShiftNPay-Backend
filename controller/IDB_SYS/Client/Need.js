const Models = require('./../../../model/index');

exports.getNeedByVendor = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const query = {
      vendorId,
      ...(search && {
        description: { $regex: search, $options: "i" },
      }),
    };

    const need = await Models.Need.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Models.Need.countDocuments(query);

    res.json({
      data:need,
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

exports.getNeedById = async (req, res) => {
  try {
    const need = await Models.Need.findById(req.params.id);
    if (!need) return res.status(404).json({ message: 'Need not found' });
    res.json(need);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createNeed = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { description } = req.body;

    const newNeed = new Models.Need({
      vendorId,
      description,
    });

    await newNeed.save();
    res.status(201).json(newNeed);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateNeed = async (req, res) => {
  try {
    const need = await Models.Need.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!need) return res.status(404).json({ message: 'Need not found' });
    res.json(need);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteNeed = async (req, res) => {
  try {
    const need = await Models.Need.findByIdAndDelete(req.params.id);
    if (!need) return res.status(404).json({ message: 'Need not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
