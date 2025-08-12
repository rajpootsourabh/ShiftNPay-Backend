const Models = require('./../../../model/index');

exports.getReminderListByVendor = async (req, res) => {
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

    const data = await Models.ReminderList.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Models.ReminderList.countDocuments(query);

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

exports.getReminderListById = async (req, res) => {
  try {
    const data = await Models.ReminderList.findById(req.params.id);
    if (!data) return res.status(404).json({ message: 'ReminderList not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createReminderList = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { description, client, defaultVal, caregiver, autoRemind, sortOrder } = req.body;

    const newReminderList = new Models.ReminderList({
      vendorId,
      description,
      client,
      defaultVal,
      caregiver,
      autoRemind, 
      sortOrder
    });

    await newReminderList.save();
    res.status(201).json(newReminderList);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateReminderList = async (req, res) => {
  try {
    const data = await Models.ReminderList.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!data) return res.status(404).json({ message: 'ReminderList not found' });
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteReminderList = async (req, res) => {
  try {
    const data = await Models.ReminderList.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ message: 'ReminderList not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
