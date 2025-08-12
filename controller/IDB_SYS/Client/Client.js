const Models = require('./../../../model/index');

exports.getClientByVendor = async (req, res) => {
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
          { email: { $regex: search, $options: "i" } },
          { phone1: { $regex: search, $options: "i" } }
        ]
      }),
    };

    const clients = await Models.Client.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Models.Client.countDocuments(query);

    res.json({
      clients,
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

exports.getClientById = async (req, res) => {
  try {
    const client = await Models.Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createClient = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const clientData = req.body;

    const newClient = new Models.Client({
      vendorId,
      ...clientData
    });

    await newClient.save();
    res.status(201).json(newClient);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern.email) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(400).json({ message: err.message });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const client = await Models.Client.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (err) {
    if (err.code === 11000 && err.keyPattern.email) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(400).json({ message: err.message });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const client = await Models.Client.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json({ message: 'Client deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};