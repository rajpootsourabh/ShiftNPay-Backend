const Models = require('./../../../model/index');

exports.getClientTypesByVendor = async (req, res) => {
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
        shortDescription: { $regex: search, $options: "i" },
      }),
    };

    const clientTypes = await Models.ClientTypes.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Models.ClientTypes.countDocuments(query);

    res.json({
      clientTypes,
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

exports.getClientTypeById = async (req, res) => {
  try {
    const clientTypes = await Models.ClientTypes.findById(req.params.id);
    if (!clientTypes) return res.status(404).json({ message: 'Note Type not found' });
    res.json(clientTypes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createClientType = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { description, shortDescription } = req.body;


    const newClientType = new Models.ClientTypes({
      vendorId,
      description,
      shortDescription,
    });

    await newClientType.save();
    res.status(201).json(newClientType);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateClientType = async (req, res) => {
  try {
    const clientTypes = await Models.ClientTypes.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!clientTypes) return res.status(404).json({ message: 'Note Type not found' });
    res.json(clientTypes);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteClientType = async (req, res) => {
  try {
    const clientTypes = await Models.ClientTypes.findByIdAndDelete(req.params.id);
    if (!clientTypes) return res.status(404).json({ message: 'Note Type not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
