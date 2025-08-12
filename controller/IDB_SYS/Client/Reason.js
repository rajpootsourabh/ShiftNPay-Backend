const Models = require('./../../../model/index');

exports.getReasonByVendor = async (req, res) => {
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

    const data = await Models.Reason.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Models.Reason.countDocuments(query);

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

exports.getReasonById = async (req, res) => {
  try {
    const data = await Models.Reason.findById(req.params.id);
    if (!data) return res.status(404).json({ message: 'Reason not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createReason = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { description, client, ios, caregiver } = req.body;

    const newReason = new Models.Reason({
      vendorId,
      description,
      client,
      ios,
      caregiver,
    });

    await newReason.save();
    res.status(201).json(newReason);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateReason = async (req, res) => {
  try {
    const data = await Models.Reason.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!data) return res.status(404).json({ message: 'Reason not found' });
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteReason = async (req, res) => {
  try {
    const data = await Models.Reason.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ message: 'Reason not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
