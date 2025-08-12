const Models = require('./../../../model/index');

exports.getRelationshipByVendor = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const query = {
      vendorId,
      ...(search && {
        relation: { $regex: search, $options: "i" },
      }),
    };

    const data = await Models.Relationship.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Models.Relationship.countDocuments(query);

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

exports.getRelationshipById = async (req, res) => {
  try {
    const data = await Models.Relationship.findById(req.params.id);
    if (!data) return res.status(404).json({ message: 'Relationship not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createRelationship = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { relation } = req.body;

    const newRelationship = new Models.Relationship({
      vendorId,
      relation,
    });

    await newRelationship.save();
    res.status(201).json(newRelationship);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateRelationship = async (req, res) => {
  try {
    const data = await Models.Relationship.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!data) return res.status(404).json({ message: 'Relationship not found' });
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteRelationship = async (req, res) => {
  try {
    const data = await Models.Relationship.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ message: 'Relationship not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
