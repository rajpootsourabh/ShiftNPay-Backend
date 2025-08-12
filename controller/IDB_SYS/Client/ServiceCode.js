const Models = require('./../../../model/index');

exports.getServiceCodeByVendor = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "";

    const query = {
      ...(search && {
        $or: [
          { description: { $regex: search, $options: "i" } },
          { procedureCode: { $regex: search, $options: "i" } },
          { shortDesc: { $regex: search, $options: "i" } }
        ]
      }),
      ...(status && { status })
    };

    const data = await Models.ServiceCode.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Models.ServiceCode.countDocuments(query);

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

exports.getServiceCodeById = async (req, res) => {
  try {
    const data = await Models.ServiceCode.findById(req.params.id);
    if (!data) return res.status(404).json({ message: 'ServiceCode not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createServiceCode = async (req, res) => {
  try {
    const { 
      description, 
      shortDesc, 
      procedureCode, 
      type, 
      cost, 
      status, 
      billedPerVisit,
      adpIncludeInAdjustedDed,
      overridePaychexFlex,
      payplusExport,
      mod1,
      mod2,
      mod3,
      mod4,
      tos,
      supplementalInfo,
      revCode,
      otherEVVSystem,
      taxonomyCode
    } = req.body;

    const newServiceCode = new Models.ServiceCode({
      description,
      shortDesc,
      procedureCode,
      type,
      cost,
      status,
      billedPerVisit,
      adpIncludeInAdjustedDed,
      overridePaychexFlex,
      payplusExport,
      mod1,
      mod2,
      mod3,
      mod4,
      tos,
      supplementalInfo,
      revCode,
      otherEVVSystem,
      taxonomyCode
    });

    await newServiceCode.save();
    res.status(201).json(newServiceCode);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateServiceCode = async (req, res) => {
  try {
    const data = await Models.ServiceCode.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!data) return res.status(404).json({ message: 'ServiceCode not found' });
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteServiceCode = async (req, res) => {
  try {
    const data = await Models.ServiceCode.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ message: 'ServiceCode not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getActiveServiceCodes = async (req, res) => {
  try {
    const data = await Models.ServiceCode.find({ status: 'Active' })
      .sort({ description: 1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};