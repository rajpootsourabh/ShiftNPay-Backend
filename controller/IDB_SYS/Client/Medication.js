const Models = require('./../../../model/index');

exports.getMedicationByVendor = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const query = {
      vendorId,
      ...(search && {
        drugName: { $regex: search, $options: "i" },
      }),
    };

    const medication = await Models.Medication.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Models.Medication.countDocuments(query);

    res.json({
      medication,
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

exports.getMedicationById = async (req, res) => {
  try {
    const medication = await Models.Medication.findById(req.params.id);
    if (!medication) return res.status(404).json({ message: 'Data not found' });
    res.json(medication);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createMedication = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { drugName } = req.body;


    const newMedication = new Models.Medication({
      vendorId,
      drugName,
    });

    await newMedication.save();
    res.status(201).json(newMedication);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateMedication = async (req, res) => {
  try {
    const medication = await Models.Medication.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!medication) return res.status(404).json({ message: 'Data not found' });
    res.json(medication);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteMedication = async (req, res) => {
  try {
    const medication = await Models.Medication.findByIdAndDelete(req.params.id);
    if (!medication) return res.status(404).json({ message: 'Data not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
