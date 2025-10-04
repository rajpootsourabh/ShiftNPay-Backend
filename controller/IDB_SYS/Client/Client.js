const Models = require('./../../../model/index');
const mongoose = require('mongoose')
exports.getClientByVendor = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "";
    const location = req.query.location || "";
    const clientType = req.query.clientType || "";
    const dateStart = req.query.dateStart || "";
    const dateEnd = req.query.dateEnd || "";
    const dateField = req.query.dateField || "createdAt"; // Field to filter by

    // Build the query object
    const query = {
      vendorId: new mongoose.Types.ObjectId(vendorId),
    };

    // Search filter (multiple fields)
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone1: { $regex: search, $options: "i" } },
        { phone2: { $regex: search, $options: "i" } },
        { medRecordNumber: { $regex: search, $options: "i" } },
        { ssn: { $regex: search, $options: "i" } },
        { "homeAddress1": { $regex: search, $options: "i" } },
        { "homeCity": { $regex: search, $options: "i" } }
      ];
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Location filter
    if (location) {
      query.locationId = new mongoose.Types.ObjectId(location);
    }

    // Client Type filter
    if (clientType) {
      query.clientType = new mongoose.Types.ObjectId(clientType);
    }

    // Date Range filter
    if (dateStart || dateEnd) {
      const dateFilter = {};
      
      if (dateStart) {
        dateFilter.$gte = new Date(dateStart);
      }
      if (dateEnd) {
        // Set end date to end of day for inclusive range
        const endDate = new Date(dateEnd);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.$lte = endDate;
      }
      
      query[dateField] = dateFilter;
    }

    // Execute query with population
    const clients = await Models.Client.find(query)
      .populate('locationId', 'name address city state')
      .populate('clientType', 'name description')
      .populate('caseManager', 'firstName lastName email phone')
      .populate('caseManager2', 'firstName lastName email phone')
      .populate('caseManager3', 'firstName lastName email phone')
      .populate('physician', 'firstName lastName specialty phone')
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
      filters: {
        search,
        status,
        location,
        clientType,
        dateStart,
        dateEnd,
        dateField
      }
    });
  } catch (err) {
    console.error('Error fetching clients:', err);
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
    const { _id } = clientData;

    if (_id) {
      const updatedClient = await Models.Client.findOneAndUpdate(
        { _id, vendorId }, // ensure vendorId matches
        { ...clientData, vendorId },
        { new: true, runValidators: true }
      );

      if (!updatedClient) {
        return res.status(404).json({ message: "Client not found" });
      }

      return res.status(200).json(updatedClient);
    } else {
      const newClient = new Models.Client({
        vendorId,
        ...clientData
      });

      await newClient.save();
      return res.status(201).json(newClient);
    }
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(400).json({ message: "Email already exists" });
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