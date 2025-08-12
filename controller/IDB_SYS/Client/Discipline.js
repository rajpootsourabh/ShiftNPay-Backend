const Models = require('./../../../model/index');

exports.getDisciplineByVendor = async (req, res) => {
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
        uniqueId: { $regex: search, $options: "i" },
      }),
    };

    const discipline = await Models.Discipline.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Models.Discipline.countDocuments(query);

    res.json({
      discipline,
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

exports.getDisciplineById = async (req, res) => {
  try {
    const discipline = await Models.Discipline.findById(req.params.id);
    if (!discipline) return res.status(404).json({ message: 'Discipline not found' });
    res.json(discipline);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createDiscipline = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { uniqueId, description } = req.body;

    const newDiscipline = new Models.Discipline({
      vendorId,
      uniqueId,
      description,
    });

    await newDiscipline.save();
    res.status(201).json(newDiscipline);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateDiscipline = async (req, res) => {
  try {
    const discipline = await Models.Discipline.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!discipline) return res.status(404).json({ message: 'Discipline not found' });
    res.json(discipline);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteDiscipline = async (req, res) => {
  try {
    const discipline = await Models.Discipline.findByIdAndDelete(req.params.id);
    if (!discipline) return res.status(404).json({ message: 'Discipline not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
