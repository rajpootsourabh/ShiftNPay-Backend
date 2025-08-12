const Models = require('./../../../model/index');

exports.getSalesRepByVendor = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const query = {
      vendorId,
      ...(search && {
        firstName: { $regex: search, $options: "i" },
        lastName: { $regex: search, $options: "i" },
      }),
    };

    const data = await Models.SalesRep.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Models.SalesRep.countDocuments(query);

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

exports.getSalesRepById = async (req, res) => {
  try {
    const saleRep = await Models.SalesRep.findById(req.params.id);
    if (!saleRep) return res.status(404).json({ message: 'Sales Rep not found' });
    res.json(saleRep);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createSalesRep = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const { firstName, lastName, status } = req.body;
    console.log(req.body,'req.body')
    const allowedStatus = ['Active', 'Inactive'];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const newSalesRep = new Models.SalesRep({
      vendorId,
      firstName,
      lastName,
      status,
    });
    console.log(newSalesRep)
    await newSalesRep.save();
    res.status(201).json(newSalesRep);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateSalesRep = async (req, res) => {
  try {
    const { status } = req.body;
    if (status) {
      const allowedStatus = ['Active', 'Inactive', 'Pending'];
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
    }

    const saleRep = await Models.SalesRep.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!saleRep) return res.status(404).json({ message: 'Sales Rep not found' });
    res.json(saleRep);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteSalesRep = async (req, res) => {
  try {
    const saleRep = await Models.SalesRep.findByIdAndDelete(req.params.id);
    if (!saleRep) return res.status(404).json({ message: 'Sales Rep not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
