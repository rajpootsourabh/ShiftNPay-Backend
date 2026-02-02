const Models = require("./../../../model/index");
const mongoose = require("mongoose");
const fileUploadService = require('../../../util/clientFileUpload');

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
    const dateField = req.query.dateField || "createdAt";

    const query = {
      vendorId: new mongoose.Types.ObjectId(vendorId),
    };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone1: { $regex: search, $options: "i" } },
        { phone2: { $regex: search, $options: "i" } },
        { medRecordNumber: { $regex: search, $options: "i" } },
        { ssn: { $regex: search, $options: "i" } },
        { homeAddress1: { $regex: search, $options: "i" } },
        { homeCity: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (location) {
      query.locationId = new mongoose.Types.ObjectId(location);
    }

    if (clientType) {
      query.clientType = new mongoose.Types.ObjectId(clientType);
    }

    if (dateStart || dateEnd) {
      const dateFilter = {};

      if (dateStart) {
        dateFilter.$gte = new Date(dateStart);
      }
      if (dateEnd) {
        const endDate = new Date(dateEnd);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.$lte = endDate;
      }

      query[dateField] = dateFilter;
    }

    const clients = await Models.Client.find(query)
      .populate("locationId", "name address city state")
      .populate("clientType", "name description")
      .populate("caseManager", "firstName lastName email phone")
      .populate("caseManager2", "firstName lastName email phone")
      .populate("caseManager3", "firstName lastName email phone")
      .populate("physician", "firstName lastName specialty phone")
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
        dateField,
      },
    });
  } catch (err) {
    console.error("Error fetching clients:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getClientById = async (req, res) => {
  try {
    const client = await Models.Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json(client);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createClient = async (req, res) => {
  try {
    const vendorId = req.user._id;
    
    let clientData = {};
    if (req.body.data) {
      clientData = JSON.parse(req.body.data);
    } else {
      clientData = { ...req.body };
    }

    const { _id } = clientData;

    if (req.files && req.files.attachments) {
      await handleFileAttachments(req, clientData, _id);
    }

    if (_id) {
      const updatedClient = await Models.Client.findOneAndUpdate(
        { _id, vendorId },
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
        ...clientData,
      });

      await newClient.save();
      
      if (req.files && req.files.attachments && newClient._id) {
        await handleFileAttachments(req, clientData, newClient._id);
        const updatedClient = await Models.Client.findById(newClient._id);
        return res.status(201).json(updatedClient);
      }

      return res.status(201).json(newClient);
    }
  } catch (err) {
    console.error('Error in createClient:', err);
    res.status(400).json({ message: err.message });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const clientId = req.params.id;
    
    if (!clientId || clientId === 'undefined') {
      return res.status(400).json({ message: "Client ID is required" });
    }

    const existingClient = await Models.Client.findById(clientId);
    if (!existingClient) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    let updateData = {};
    if (req.body.data) {
      updateData = JSON.parse(req.body.data);
    } else {
      updateData = { ...req.body };
    }

    if (req.files && req.files.attachments) {
      await handleFileAttachments(req, updateData, clientId);
    }

    const client = await Models.Client.findByIdAndUpdate(
      clientId, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json(client);
  } catch (err) {
    console.error('Error in updateClient:', err);
    res.status(400).json({ message: err.message });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const client = await Models.Client.findById(req.params.id);

    if (!client) return res.status(404).json({ message: "Client not found" });

    if (client.attachments && client.attachments.length > 0) {
      for (const attachment of client.attachments) {
        if (attachment.fileName) {
          await fileUploadService.deleteFile(attachment.fileName);
        }
      }
    }

    await Models.Client.findByIdAndDelete(req.params.id);
    res.json({ message: "Client deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

async function handleFileAttachments(req, clientData, clientId = null) {
  try {
    if (!clientId) {
      throw new Error("Client ID is required for file uploads");
    }
    
    if (!req.files || !req.files.attachments) {
      return;
    }

    const files = Array.isArray(req.files.attachments) 
      ? req.files.attachments 
      : [req.files.attachments];

    for (const [index, file] of files.entries()) {
      try {
        if (file.size === 0) {
          continue;
        }

        const fileInfo = await fileUploadService.saveFile(file, clientId);

        const description = req.body[`attachments[${index}][description]`] || file.name;
        const clientAccess = req.body[`attachments[${index}][clientAccess]`] || "restricted";

        const attachment = {
          description: description,
          fileName: fileInfo.fileName,
          originalName: fileInfo.originalName,
          url: fileInfo.url,
          fileSize: fileInfo.fileSize,
          fileType: fileInfo.fileType,
          uploadedAt: fileInfo.uploadedAt,
          clientAccess: clientAccess,
        };

        await Models.Client.findByIdAndUpdate(
          clientId,
          { $push: { attachments: attachment } },
          { new: true }
        );

      } catch (error) {
        // Continue with other files even if one fails
      }
    }
    
    const updatedClient = await Models.Client.findById(clientId);
    clientData.attachments = updatedClient.attachments;

  } catch (error) {
    throw error;
  }
}

exports.uploadClientAttachment = async (req, res) => {
  try {
    const clientId = req.params.clientId;

    if (!req.files || !req.files.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const fileInfo = await fileUploadService.saveFile(req.files.file, clientId);

    const attachment = {
      description: req.body.description || req.files.file.name,
      fileName: fileInfo.fileName,
      originalName: fileInfo.originalName,
      url: fileInfo.url,
      fileSize: fileInfo.fileSize,
      fileType: fileInfo.fileType,
      uploadedAt: fileInfo.uploadedAt,
      clientAccess: req.body.clientAccess || "restricted",
    };

    await Models.Client.findByIdAndUpdate(
      clientId,
      { $push: { attachments: attachment } },
      { new: true }
    );

    res.json(attachment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteClientAttachment = async (req, res) => {
  try {
    const { clientId, attachmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(clientId) || !mongoose.Types.ObjectId.isValid(attachmentId)) {
      return res.status(400).json({ message: "Invalid client ID or attachment ID" });
    }

    const client = await Models.Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    const attachment = client.attachments.find(att => 
      att._id && att._id.toString() === attachmentId
    );

    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    if (attachment.fileName) {
      try {
        await fileUploadService.deleteFile(attachment.fileName);
      } catch (fileError) {
        // Continue with database cleanup even if file deletion fails
      }
    }

    const updatedClient = await Models.Client.findByIdAndUpdate(
      clientId,
      { 
        $pull: { 
          attachments: { _id: new mongoose.Types.ObjectId(attachmentId) } 
        } 
      },
      { 
        new: true,
        runValidators: true 
      }
    );

    if (!updatedClient) {
      return res.status(404).json({ message: "Client not found during update" });
    }

    res.json({ 
      message: "Attachment deleted successfully",
      deletedAttachment: {
        _id: attachmentId,
        fileName: attachment.fileName,
        originalName: attachment.originalName
      }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    res.status(500).json({ 
      message: error.message || "Internal server error" 
    });
  }
};