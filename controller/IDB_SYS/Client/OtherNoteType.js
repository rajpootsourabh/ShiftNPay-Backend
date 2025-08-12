const Models = require('./../../../model/index');

exports.getOtherNoteTypeByVendor = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const query = {
      vendorId,
      ...(search && {
        customField: { $regex: search, $options: "i" },
      }),
    };

    const data = await Models.OtherNoteType.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Models.OtherNoteType.countDocuments(query);

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

exports.getOtherNoteTypeById = async (req, res) => {
  try {
    const data = await Models.OtherNoteType.findById(req.params.id);
    if (!data) return res.status(404).json({ message: 'Other Note Type not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createOtherNoteType = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { description, status, referral, physician, caseManager } = req.body;

    const newOtherNoteType = new Models.OtherNoteType({
      vendorId,
      description,
      status,
      referral,
      physician,
      caseManager,
    });

    await newOtherNoteType.save();
    res.status(201).json(newOtherNoteType);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateOtherNoteType = async (req, res) => {
  try {
    const customField = await Models.OtherNoteType.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customField) return res.status(404).json({ message: 'Other Note Type not found' });
    res.json(customField);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteOtherNoteType = async (req, res) => {
  try {
    const customField = await Models.OtherNoteType.findByIdAndDelete(req.params.id);
    if (!customField) return res.status(404).json({ message: 'Other Note Type not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
