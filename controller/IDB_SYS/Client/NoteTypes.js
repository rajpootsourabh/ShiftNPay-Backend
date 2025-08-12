const Models = require('./../../../model/index');

exports.getNoteTypesByVendor = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const query = {
      vendorId,
      ...(search && {
        description: { $regex: search, $options: "i" }
      }),
    };

    const noteTypes = await Models.NoteTypes.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Models.NoteTypes.countDocuments(query);

    res.json({
      noteTypes,
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

exports.getNoteTypeById = async (req, res) => {
  try {
    const noteType = await Models.NoteTypes.findById(req.params.id);
    if (!noteType) return res.status(404).json({ message: 'Note Type not found' });
    res.json(noteType);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createNoteType = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { description, status } = req.body;

    const allowedStatus = ['Active', 'Inactive', 'Pending'];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const newNoteType = new Models.NoteTypes({
      vendorId,
      description,
      status,
    });

    await newNoteType.save();
    res.status(201).json(newNoteType);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateNoteType = async (req, res) => {
  try {
    const { status } = req.body;
    if (status) {
      const allowedStatus = ['Active', 'Inactive', 'Pending'];
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
    }

    const noteType = await Models.NoteTypes.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!noteType) return res.status(404).json({ message: 'Note Type not found' });
    res.json(noteType);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteNoteType = async (req, res) => {
  try {
    const noteType = await Models.NoteTypes.findByIdAndDelete(req.params.id);
    if (!noteType) return res.status(404).json({ message: 'Note Type not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
