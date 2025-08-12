const Models = require('./../../../model/index');

exports.getCustomFieldByVendor = async (req, res) => {
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

    const customFields = await Models.CustomField.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Models.CustomField.countDocuments(query);

    res.json({
      customFields,
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

exports.getCustomFieldById = async (req, res) => {
  try {
    const customField = await Models.CustomField.findById(req.params.id);
    if (!customField) return res.status(404).json({ message: 'Custom Field not found' });
    res.json(customField);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createCustomField = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { description, customField, client, caregiver, printOnInfoSummary, sortOrder, default: isDefault } = req.body;

    const newCustomField = new Models.CustomField({
      vendorId,
      description,
      customField,
      client,
      caregiver,
      printOnInfoSummary,
      sortOrder,
      default: isDefault,
    });

    await newCustomField.save();
    res.status(201).json(newCustomField);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateCustomField = async (req, res) => {
  try {
    const customField = await Models.CustomField.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customField) return res.status(404).json({ message: 'Custom Field not found' });
    res.json(customField);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteCustomField = async (req, res) => {
  try {
    const customField = await Models.CustomField.findByIdAndDelete(req.params.id);
    if (!customField) return res.status(404).json({ message: 'Custom Field not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
