const LeaveType = require('./../../model/leaveType');

// Create a new leave type
exports.createLeaveType = async (req, res) => {
    try {
        const vendorId = req.payload.reqUserId;
        const leaveType = new LeaveType({
            ...req.body, // spread operator to include all fields
            vendorId,    // explicitly set vendorId
        });

        await leaveType.save();
        res.status(201).json({ message: 'Leave type created successfully', leaveType });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Error creating leave type', error: error.message });
    }
};

// Get all leave types for a specific vendor
exports.getLeaveTypes = async (req, res) => {
    try {
        const vendorId = req.payload.reqUserId; // Get vendorId from query params

        const leaveTypes = await LeaveType.find({ vendorId }); // Filter leave types by vendorId
        res.status(200).json(leaveTypes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching leave types', error: error.message });
    }
};

// Get a leave type by ID
exports.getLeaveTypeById = async (req, res) => {
    try {
        const vendorId = req.payload.reqUserId;
        const leaveType = await LeaveType.findById(req.params.id);
        if (!leaveType) {
            return res.status(200).json({ message: 'Leave type not found',data:[] });
        }
        res.status(200).json(leaveType);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching leave type', error: error.message });
    }
};

// Update a leave type by ID
exports.updateLeaveType = async (req, res) => {
    try {
        const vendorId = req.payload.reqUserId;
        const leaveType = await LeaveType.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!leaveType) {
            return res.status(404).json({ message: 'Leave type not found' });
        }
        res.status(200).json({ message: 'Leave type updated successfully', leaveType });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Error updating leave type', error: error.message });
    }
};

// Delete a leave type by ID
exports.deleteLeaveType = async (req, res) => {
    try {
        const vendorId = req.payload.reqUserId;
        const leaveType = await LeaveType.findByIdAndDelete(req.params.id);
        if (!leaveType) {
            return res.status(404).json({ message: 'Leave type not found' });
        }
        res.status(200).json({ message: 'Leave type deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting leave type', error: error.message });
    }
};
