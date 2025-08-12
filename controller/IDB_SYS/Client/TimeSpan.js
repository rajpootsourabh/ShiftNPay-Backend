const Models = require('./../../../model/index');

exports.getTimeSpanByVendor = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const query = {
      vendorId,
      ...(search && {
        data: { $regex: search, $options: "i" },
      }),
    };

    const data = await Models.TimeSpan.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Models.TimeSpan.countDocuments(query);

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

exports.getTimeSpanById = async (req, res) => {
  try {
    const data = await Models.TimeSpan.findById(req.params.id);
    if (!data) return res.status(404).json({ message: 'TimeSpan not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createTimeSpan = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { description, frequency, sortOrder, unit } = req.body;

    const newTimeSpan = new Models.TimeSpan({
      vendorId,
      description,
      frequency,
      sortOrder,
      unit,
    });

    await newTimeSpan.save();
    res.status(201).json(newTimeSpan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateTimeSpan = async (req, res) => {
  try {
    const data = await Models.TimeSpan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!data) return res.status(404).json({ message: 'TimeSpan not found' });
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteTimeSpan = async (req, res) => {
  try {
    const data = await Models.TimeSpan.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ message: 'TimeSpan not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
