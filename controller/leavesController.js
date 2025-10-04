const Employee = require('../model/Employee');
const User = require('../model/User');
const LeaveManagement = require('./../model/leaveManagement');  // Adjust the path as necessary
const LeaveType = require('./../model/leaveType');
const mongoose = require('mongoose');
const Services = require('./../services');
const path = require('path')
const fs = require('fs')
const Holiday = require("./../model/Holiday");

exports.allotLeaveToEmployee = async (req, res) => {
    const { employeeId, leaveType, leaveCount } = req.body;
    const vendorId = req.payload.reqUserId; // Assuming the vendor's ID is available in the payload

    try {
        let leaveRecord = await LeaveManagement.findOne({ employeeId, vendorId });

        // If no record exists, create a new one
        if (!leaveRecord) {
            leaveRecord = new LeaveManagement({
                employeeId,
                vendorId,
                leaves: []
            });
        }

        // Find the specific leave type entry
        let leaveEntry = leaveRecord.leaves.find(leave => leave.leaveType.toString() === leaveType);

        if (!leaveEntry) {
            // Create a new leave entry if not found
            leaveEntry = {
                leaveType,
                allotted: [],
                consumed: []
            };
            leaveRecord.leaves.push(leaveEntry);
        }

        // Add the allotted leave
        leaveRecord.leaves.forEach(leave => {
            if (leave.leaveType.toString() === leaveType) {
                leave.allotted.push({
                    date: new Date(),
                    count: leaveCount
                });
            }
        });

        await leaveRecord.save();
        res.status(200).json({ message: 'Leave allotted successfully', leaveRecord });
    } catch (error) {
        console.error('Error allotting leave:', error.message);
        res.status(500).json({ message: 'Error allotting leave: ' + error.message });
    }
};

exports.updateLeaveForEmployee = async (req, res) => {
    try {
        const { employeeId, leaveType, year, alloted, consumed } = req.body;

        // Find the leave data for the employee for the specified year
        const leaveData = await Leave.findOne({ employeeId, "data.year": year });

        // If no leave data exists, return an error
        if (!leaveData) {
            return res.status(404).json({ message: 'Leave record not found for the given employee and year' });
        }

        // Find the specific year's data
        const yearData = leaveData.data.find(item => item.year === year);

        // Check if the leaveType exists within the year's leave data (since it's stored as a Map)
        if (!yearData.leaves.has(leaveType)) {
            return res.status(404).json({ message: 'Leave type not found for the specified year' });
        }

        // Update the "alloted" leaves if provided
        if (alloted) {
            yearData.leaves.get(leaveType).alloted = [
                ...yearData.leaves.get(leaveType).alloted,
                ...alloted
            ];
        }

        // Update the "consumed" leaves if provided
        if (consumed) {
            yearData.leaves.get(leaveType).consumed = [
                ...yearData.leaves.get(leaveType).consumed,
                ...consumed
            ];
        }

        // Save the updated leave data
        await leaveData.save();

        return res.status(200).json({ message: 'Leave updated successfully', leaveData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllEmployeeLeaves = async (req, res) => {
    const vendorId = req.payload.reqUserId; // Assuming the vendor's ID is available in the payload

    try {
        // Fetch all employees for the vendor
        const employees = await Employee.find({ userId: vendorId }, '_id firstName lastName email');
        console.log('employees : employees', employees)

        // Fetch all leave types
        const leaveTypes = await LeaveType.find({vendorId}, '_id name '); // Assuming leave type has name field

        // Fetch leave records for all employees under the vendor
        const leaveRecords = await LeaveManagement.find({ vendorId });

        // Prepare response data
        const responseData = employees.map(employee => {
            // Start with employee information
            const employeeData = {
                employeeId: employee._id,
                email: employee.email,
                employeeName: `${employee.firstName} ${employee.lastName}`,
            };

            // Initialize leave data for all leave types
            leaveTypes.forEach(type => {
                employeeData[type.name] = { allotted: 0, consumed: 0 };
            });

            // Find the employee's leave record
            const leaveRecord = leaveRecords.find(record => record.employeeId.toString() === employee._id.toString());

            if (leaveRecord) {
                leaveRecord.leaves.forEach(leaveEntry => {
                    const leaveType = leaveTypes.find(type => type._id.equals(leaveEntry.leaveType));
                    if (leaveType) {
                        const totalAllotted = leaveEntry.allotted.reduce((sum, leave) => sum + leave.count, 0);
                        const totalConsumed = leaveEntry.consumed.reduce((sum, leave) => sum + leave.count, 0);

                        employeeData[String(leaveType._id)] = {
                            allotted: totalAllotted,
                            consumed: totalConsumed,
                        };
                    }
                });
            }

            return employeeData;
        });

        // *** Additional Logic for Consumed Leave Details ***
        const consumedLeaveDetails = await LeaveManagement.aggregate([
            {
                $match: {
                    vendorId: new mongoose.Types.ObjectId(vendorId), // Match by vendor ID
                },
            },
            {
                $unwind: '$leaves', // Unwind the leaves array
            },
            {
                $unwind: '$leaves.consumed', // Unwind the consumed leaves array
            },
            {
                // Lookup to join leaveType information
                $lookup: {
                    from: 'leavetypes',
                    localField: 'leaves.leaveType',
                    foreignField: '_id',
                    as: 'leaveTypeInfo',
                },
            },
            {
                // Unwind the leaveTypeInfo array to bring it to the document level
                $unwind: '$leaveTypeInfo',
            },
            {
                // Lookup to join approvedBy (vendor) information from the User collection
                $lookup: {
                    from: 'users',
                    localField: 'leaves.consumed.approvedBy',
                    foreignField: '_id',
                    as: 'approvedByInfo',
                },
            },
            {
                // Unwind the approvedByInfo array if needed (might be empty if not approved)
                $unwind: {
                    path: '$approvedByInfo',
                    preserveNullAndEmptyArrays: true, // Keep the data even if there is no approvedBy
                },
            },
            {
                // Group by employeeId and accumulate consumed leave details
                $group: {
                    _id: '$employeeId',
                    leaves: {
                        $push: {
                            leaveType: '$leaveTypeInfo.name',
                            appliedDate: '$leaves.consumed.appliedDate',
                            startDate: '$leaves.consumed.startDate',
                            endDate: '$leaves.consumed.endDate',
                            periodOfLeave: '$leaves.consumed.periodOfLeave',
                            count: '$leaves.consumed.count',
                            status: '$leaves.consumed.status',
                            reason: '$leaves.consumed.reason',
                            approvedBy: '$approvedByInfo.name', // Vendor name who approved the leave
                        },
                    },
                },
            },
        ]);

        // Combine leave summary and consumed leave details into a single object per employee
        const finalResponseData = responseData.map(employee => {
            const consumedDetails = consumedLeaveDetails.find(detail => detail._id.toString() === employee.employeeId.toString());

            return {
                ...employee,
                consumedLeaves: consumedDetails ? consumedDetails.leaves : [], // Add consumed leave details if available
            };
        });

        res.status(200).json({
            message: 'Leaves fetched successfully',
            data: finalResponseData,
            leaveTypes,
        });
    } catch (error) {
        console.error('Error fetching employee leaves:', error.message);
        res.status(500).json({ message: 'Error fetching employee leaves: ' + error.message });
    }
};


exports.employeeAvailableLeaves = async (req, res) => {
    const { employeeId } = req.params;

    try {
        const employeeLeaveData = await LeaveManagement.findOne({ employeeId });

        if (!employeeLeaveData) {
            return res.status(404).json({ message: 'Employee leave data not found' });
        }

        const { vendorId, leaves } = employeeLeaveData;

        // Fetch leave types created by the vendor
        const leaveTypes = await LeaveType.find({ vendorId });

        if (!leaveTypes || leaveTypes.length === 0) {
            return res.status(404).json({ message: 'No leave types found for the vendor' });
        }

        // Prepare the available leave data
        const availableLeaves = {};

        // Iterate through the employee's leaves and calculate available leaves
        leaves.forEach((leave) => {
            const leaveTypeId = leave.leaveType.toString();

            // Find the corresponding leave type from the vendor's leave types
            const leaveType = leaveTypes.find(type => type._id.toString() === leaveTypeId);

            if (leaveType) {
                // Sum all allotted leave counts
                const totalAllotted = leave.allotted.reduce((sum, allotment) => sum + allotment.count, 0);

                // Sum all consumed leave counts (only those with status 'approved')
                const totalConsumed = leave.consumed.reduce((sum, consumption) => {
                    return consumption.status != 'rejected' ? sum + consumption.count : sum;
                }, 0);

                // Calculate available leaves by subtracting consumed leaves from allotted leaves
                availableLeaves[leaveType._id] = totalAllotted - totalConsumed;
            }
        });

        res.json({ leaveTypes, availableLeaves });
    } catch (error) {
        console.error('Error fetching leave data', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getEmployeeLeaves = async (req, res) => {
    const employeeId = req.payload.reqUserId; // Assuming reqUserId is the employee's ID

    try {
        // Fetch leave data for the employee
        const leaveData = await LeaveManagement.findOne({ employeeId })
            .populate('leaves.leaveType') // Correctly populating the leaveType inside the leaves array
            .exec();

        if (!leaveData) {
            return res.status(404).json({ message: 'No leave data found for this employee.' });
        }

        // Fetch employee details
        const employeeData = await Employee.findById(employeeId).select('_id name email');
        if (!employeeData) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Fetch vendor details
        const vendorData = await User.findById(leaveData.vendorId).select('_id name email');
        if (!vendorData) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Process leave data
        const leaveRecords = leaveData.leaves
        .flatMap(leave =>
            leave.consumed.map(consumedLeave => ({
                leaveType: leave.leaveType.name, // Get the leave type name after population
                appliedDate: consumedLeave.appliedDate,
                startDate: consumedLeave.startDate,
                endDate: consumedLeave.endDate,
                document: consumedLeave.document,
                count: consumedLeave.count,
                periodOfLeave: consumedLeave.periodOfLeave,
                status: consumedLeave.status,
                reason: consumedLeave.reason,
                _id: consumedLeave._id,
            }))
        )
        .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));

        // Structure the final response
        const response = {
            employee: {
                _id: employeeData._id,
                name: employeeData.name,
                email: employeeData.email
            },
            vendor: {
                _id: vendorData._id,
                name: vendorData.name,
                email: vendorData.email
            },
            leaveRecords: leaveRecords
        };

        // Send success response with formatted data
        res.status(200).json({
            message: 'Leaves fetched successfully',
            data: response
        });

    } catch (error) {
        // Handle any errors that occur during the request
        res.status(500).json({
            message: 'Error fetching leave data',
            error: error.message
        });
    }
};

exports.applyLeave = async (req, res) => {
    try {
        const { leaveType, startDate, endDate, reason, leaveDuration,periodOfLeave } = req.body; // Adding leaveDuration
        const employeeId = req.payload.reqUserId;

        // Validate input
        if (!employeeId || !leaveType || !startDate || (!leaveDuration && !endDate) || !reason) {
            return res.status(200).json({ success: false, message: "All fields are required" });
        }

        const isHalfDay = leaveDuration === '0.5'; // Check if it's a half-day leave
        const HolidayStart = new Date(startDate).setHours(0, 0, 0, 0);
        const HolidayEnd = isHalfDay ? HolidayStart : new Date(endDate).setHours(23, 59, 59, 999);

        // Check if the employee exists
        const checkUser = await Employee.findById(employeeId);
        if (!checkUser) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        // Check for holidays within the leave period
        const holidays = await Holiday.find({
            vendorId: checkUser.userId, // Adjust this based on your schema
            date: { $gte: HolidayStart, $lte: HolidayEnd },
        });

        if (holidays.length > 0) {
            const holidayDates = holidays.map((h) => h.date.toDateString()).join(", ");
            return res.status(200).json({
                success: false,
                message: `Cannot apply for leave. The following dates are holidays: ${holidayDates}. Please adjust your leave dates.`,
            });
        }

        // File upload logic
        const uploadedDoc = req.files?.document;
        let fileUrl = null;
        if (uploadedDoc) {
            const newDate = new Date();
            const fileName = `doc_${newDate.getTime()}_${uploadedDoc.name.replace(/\s+/g, '')}`;
            const documentPath = path.join(__dirname, '..', 'assets', 'documents', fileName);
            fileUrl = `documents/${fileName}`;

            uploadedDoc.mv(documentPath, (err) => {
                if (err) {
                    return res.status(500).json({ success: false, msg: 'Failed to move file', error: err });
                }
            });
        }

        // Parse dates and calculate leave duration
        const start = new Date(startDate);
        const end = isHalfDay ? start : new Date(endDate);
        const diffInTime = end.getTime() - start.getTime();
        const calculatedDuration = isHalfDay ? 0.5 : diffInTime / (1000 * 3600 * 24) + 1;

        // Use leaveDuration if provided, otherwise fallback to calculated duration
        const duration = leaveDuration || calculatedDuration;

        // Find the employee's leave management document
        let leaveManagement = await LeaveManagement.findOne({ employeeId });
        if (!leaveManagement) {
            return res.status(200).json({
                success: false,
                message: "Leave management record not found for this employee and vendor",
            });
        }

        // Check for overlapping leaves
        const overlappingLeaves = leaveManagement.leaves.some((leave) =>
            leave.consumed.some((consumedLeave) => {
                const consumedStart = new Date(consumedLeave.startDate).setHours(0, 0, 0, 0);
                const consumedEnd = new Date(consumedLeave.endDate).setHours(23, 59, 59, 999);
                return (
                    (HolidayStart >= consumedStart && HolidayStart <= consumedEnd) || // Start overlaps
                    (HolidayEnd >= consumedStart && HolidayEnd <= consumedEnd) || // End overlaps
                    (consumedStart >= HolidayStart && consumedEnd <= HolidayEnd) // Existing leave falls within requested leave
                );
            })
        );

        if (overlappingLeaves) {
            return res.status(200).json({
                success: false,
                message: "Cannot apply for leave as it overlaps with existing leave dates. Please choose different dates.",
            });
        }

        // Get leave details for the selected leave type
        const leave = leaveManagement.leaves.find((l) => l.leaveType.toString() === leaveType);
        if (!leave) {
            return res.status(200).json({ success: false, message: "Invalid leave type" });
        }

        // Calculate total allotted and consumed leave for the type
        const totalAllotted = leave.allotted.reduce((sum, allotment) => sum + allotment.count, 0);
        const totalConsumed = leave.consumed.reduce((sum, consumption) => sum + consumption.count, 0);
        const availableLeave = totalAllotted - totalConsumed;

        if (duration > availableLeave) {
            return res.status(200).json({
                success: false,
                message: `You are trying to apply for ${duration} days, but only ${availableLeave} days are available.`,
            });
        }
        console.log('duration ::::::' , duration)
        // Add the new leave request to the consumed array
        leave.consumed.push({
            appliedDate: new Date(),
            startDate: start,
            endDate: end, // No endDate for half-day leave
            count: duration, // Save the leave duration
            status: "pending",
            halfDay:isHalfDay,
            periodOfLeave:leaveDuration === '0.5' ? periodOfLeave : null,
            document: fileUrl,
            reason,
        });

        // Save the updated leave management document
        await leaveManagement.save();

        res.status(201).json({
            success: true,
            message: "Leave applied successfully",
            leave: leave.consumed[leave.consumed.length - 1], // Return the latest applied leave
        });
    } catch (error) {
        console.error("Error applying for leave:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};



exports.getConsumedLeavesWithStatus = async (req, res) => {
    try {
        const { employeeId } = req.params; // Assuming employeeId is provided in the request params

        const leaveData = await LeaveManagement.aggregate([
            {
                // Match the leave records for the specified employee
                $match: {
                    employeeId: mongoose.Types.ObjectId(employeeId),
                },
            },
            {
                // Unwind the leaves array to get each leave record individually
                $unwind: '$leaves',
            },
            {
                // Unwind the consumed leaves array to get each consumed leave record
                $unwind: '$leaves.consumed',
            },
            {
                // Lookup to join leaveType information
                $lookup: {
                    from: 'leavetypes', // Collection name of leave types
                    localField: 'leaves.leaveType',
                    foreignField: '_id',
                    as: 'leaveTypeInfo',
                },
            },
            {
                // Unwind the leaveTypeInfo array to bring it to the document level
                $unwind: '$leaveTypeInfo',
            },
            {
                // Lookup to join approvedBy (vendor) information from the User collection
                $lookup: {
                    from: 'users', // Collection name of users
                    localField: 'leaves.consumed.approvedBy',
                    foreignField: '_id',
                    as: 'approvedByInfo',
                },
            },
            {
                // Unwind the approvedByInfo array if needed (might be empty if not approved)
                $unwind: {
                    path: '$approvedByInfo',
                    preserveNullAndEmptyArrays: true, // Keep the data even if there is no approvedBy
                },
            },
            {
                // Project to shape the final output
                $project: {
                    _id: 0, // Exclude the _id of the LeaveManagement document
                    'leaveTypeInfo.name': 1, // Include the name of the leave type
                    'leaves.consumed.appliedDate': 1,
                    'leaves.consumed.startDate': 1,
                    'leaves.consumed.endDate': 1,
                    'leaves.consumed.count': 1,
                    'leaves.consumed.status': 1,
                    'leaves.consumed.reason': 1,
                    'approvedByInfo.name': 1, // Vendor name who approved the leave
                },
            },
            {
                // Sort the consumed leaves by appliedDate in descending order
                $sort: {
                    'leaves.consumed.appliedDate': -1,
                },
            },
        ]);

        if (!leaveData || leaveData.length === 0) {
            return res.status(404).json({ message: 'No consumed leave records found for the given employee.' });
        }

        res.status(200).json({
            message: 'Consumed leaves with status fetched successfully',
            data: leaveData,
        });
    } catch (error) {
        console.error('Error fetching consumed leaves with status:', error);
        res.status(500).json({ message: 'Server error while fetching consumed leaves.' });
    }
};

exports.getLeaveRequests = async (req, res) => {
    try {
        const vendorId = req.payload.reqUserId; 

        // Aggregation pipeline to fetch consumed leaves
        let consumedLeaves = await LeaveManagement.aggregate([
            {
                $match: {
                    vendorId: new mongoose.Types.ObjectId(vendorId),
                },
            },
            {
                $unwind: '$leaves',
            },
            {
                $unwind: '$leaves.consumed',
            },
            {
                $lookup: {
                    from: 'employees', // Employee collection
                    localField: 'employeeId',
                    foreignField: '_id',
                    as: 'employeeInfo',
                },
            },
            {
                $unwind: '$employeeInfo',
            },
            {
                $lookup: {
                    from: 'leavetypes', // Leave types collection
                    localField: 'leaves.leaveType',
                    foreignField: '_id',
                    as: 'leaveTypeInfo',
                },
            },
            {
                $unwind: '$leaveTypeInfo',
            },
            {
                $lookup: {
                    from: 'users', // Users collection for vendor info
                    localField: 'leaves.consumed.approvedBy',
                    foreignField: '_id',
                    as: 'approvedByInfo',
                },
            },
            {
                $unwind: {
                    path: '$approvedByInfo',
                    preserveNullAndEmptyArrays: true, // Keep records even if there is no approvedBy
                },
            },
            {
                $project: {
                    _id: 1, // Exclude the _id of the LeaveManagement document
                    employeeName: {
                        $concat: ['$employeeInfo.firstName', ' ', '$employeeInfo.lastName'],
                    },
                    'leaveTypeInfo.name': 1, // Leave type name
                    'leaves.consumed.appliedDate': 1,
                    'leaves.consumed._id': 1,
                    'leaves.consumed.startDate': 1,
                    'leaves.consumed.document': 1,
                    'leaves.consumed.endDate': 1,
                    'leaves.consumed.count': 1,
                    'leaves.consumed.status': 1,
                    'leaves.consumed.reason': 1,
                    'approvedByInfo.name': 1, // Vendor name who approved the leave
                },
            },
            {
                // Sort by appliedDate in descending order
                $sort: {
                    'leaves.consumed.appliedDate': -1,
                },
            },
        ]);

        if (consumedLeaves.length === 0) {
            return res.status(404).json({ message: 'No consumed leaves found.' });
        }
        if(req.query.date == 'today'){
            const today = new Date();
today.setUTCHours(0, 0, 0, 0); // Normalize to start of the day in UTC

consumedLeaves = consumedLeaves.filter((item) => {
  const leave = item.leaves.consumed;

  const startDate = new Date(leave.startDate);
  startDate.setUTCHours(0, 0, 0, 0); // Normalize to start of the day in UTC

  const endDate = new Date(leave.endDate);
  endDate.setUTCHours(0, 0, 0, 0); // Normalize to start of the day in UTC

  console.log("leave.startDate (UTC): ", startDate.toISOString().split("T")[0]);
  console.log("leave.endDate (UTC): ", endDate.toISOString().split("T")[0]);
  console.log("today (UTC): ", today.toISOString().split("T")[0]);

  // Check if today matches or is within the range
  return (
    leave.status === "approved" 
  );
});

        }

        // Return the data as a successful response
        res.status(200).json({
            message: 'Consumed leaves fetched successfully',
            data: consumedLeaves,
        });
    } catch (error) {
        console.error('Error fetching consumed leaves:', error);
        res.status(500).json({ message: 'Server error while fetching consumed leaves.' });
    }
};

exports.approveLeave = async (req, res) => {

    const { leaveManagementId, leaveId } = req.params; // leaveManagementId is the main document ID, leaveId is the specific consumed leave request ID
    const vendorId = req.payload.reqUserId; // Assuming you have middleware that provides the authenticated user's ID

    try {
        // Find the specific leaveManagement document by ID
        const leaveManagement = await LeaveManagement.findById(leaveManagementId);
        if (!leaveManagement) {
            return res.status(404).json({ msg: 'Leave Management document not found.' });
        }

        // Find the consumed leave request within the leaves array
        const leaveToApprove = leaveManagement.leaves.flatMap(leave => leave.consumed).find(leave => leave._id.equals(leaveId));
        if (!leaveToApprove) {
            return res.status(404).json({ msg: 'Leave request not found.' });
        }

        // Update the leave status to 'approved'
        leaveToApprove.status = 'approved';
        leaveToApprove.approvedDate = new Date();
        leaveToApprove.approvedBy = vendorId;

        // Save the updated document
        await leaveManagement.save();
        const employee = await Employee.findById(leaveManagement.employeeId);
        let vendor = await User.findOne({_id : vendorId})
         await Services.NotificationService.sendNotification(employee._id, employee.device_token, 'Leave Approved!', ` ${vendor.name} has Approved your Leave request of ${leaveToApprove.count} day.`, {});

        return res.status(200).json({ msg: 'Leave approved successfully.', leave: leaveToApprove });
    } catch (err) {
        return res.status(500).json({ msg: 'Server error.', error: err.message });
    }
}

exports.rejectLeave = async (req, res) => {

    const { leaveManagementId, leaveId } = req.params; // leaveManagementId is the main document ID, leaveId is the specific consumed leave request ID
    const vendorId = req.payload.reqUserId;
    try {
        // Find the specific leaveManagement document by ID
        const leaveManagement = await LeaveManagement.findById(leaveManagementId);
        if (!leaveManagement) {
            return res.status(404).json({ msg: 'Leave Management document not found.' });
        }

        // Find the consumed leave request within the leaves array
        const leaveToReject = leaveManagement.leaves.flatMap(leave => leave.consumed).find(leave => leave._id.equals(leaveId));
        if (!leaveToReject) {
            return res.status(404).json({ msg: 'Leave request not found.' });
        }

        // Update the leave status to 'rejected'
        leaveToReject.status = 'rejected';

        // Save the updated document
        await leaveManagement.save();

        const employee = await Employee.findById(leaveManagement.employeeId);
        let vendor = await User.findOne({_id : vendorId})
         await Services.NotificationService.sendNotification(employee._id, employee.device_token, 'Leave Rejected!', ` ${vendor.name} has Rejected your Leave request of ${leaveToReject.count} day.`, {});


        return res.status(200).json({ msg: 'Leave rejected successfully.', leave: leaveToReject });
    } catch (err) {
        return res.status(500).json({ msg: 'Server error.', error: err.message });
    }
}

exports.getHolidaysByVendor = async (req, res) => {
    try {
        const vendorId = req.payload.reqUserId;
      const holidays = await Holiday.find({ vendorId: vendorId });
      res.status(200).json(holidays);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  exports.getEmployeeHolidaysByVendor = async (req, res) => {
    try {
        const employeeId = req.payload.reqUserId;
      const employeeDetail = await Employee.findOne({ _id: employeeId });
      
      const holidays = await Holiday.aggregate([
        { $match: { vendorId: employeeDetail.userId } },
        { $sort: { date: 1 } } // Sort by date in ascending order
      ]);
      res.status(200).json(holidays);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  exports.createHoliday = async (req, res) => {
    try {
      const vendorId = req.payload.reqUserId;
      const { date } = req.body;
  
      const holidayDate = new Date(date).setHours(0, 0, 0, 0);
  
      const existingHoliday = await Holiday.findOne({
        vendorId: vendorId,
        date: holidayDate,
      });
  
      if (existingHoliday) {
        return res.status(400).json({
          success: false,
          message: "A holiday already exists for this date. Please choose a different date.",
        });
      }
  
      const holiday = new Holiday({ ...req.body, vendorId: vendorId, date: holidayDate });
      await holiday.save();
  
      res.status(201).json({
        success: true,
        message: "Holiday created successfully.",
        holiday,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "An error occurred while creating the holiday.",
        error: error.message,
      });
    }
  };
  
  
  exports.updateHoliday = async (req, res) => {
    try {
      const { id } = req.params;
      const vendorId = req.payload.reqUserId;
      const { date } = req.body;
      const holidayDate = new Date(date).setHours(0, 0, 0, 0);
  
      const existingHoliday = await Holiday.findOne({
        vendorId: vendorId,
        date: holidayDate,
        _id: { $ne: id },  
      });
  
      if (existingHoliday) {
        return res.status(400).json({
          success: false,
          message: "Another holiday already exists for this date. Please choose a different date.",
        });
      }
  
      const holiday = await Holiday.findOneAndUpdate(
        { _id: id, vendorId },
        { ...req.body, date: holidayDate },
        { new: true }
      );
  
      if (!holiday) {
        return res.status(404).json({ success: false, message: "Holiday not found" });
      }
  
      res.status(200).json({
        success: true,
        message: "Holiday updated successfully.",
        holiday,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "An error occurred while updating the holiday.",
        error: error.message,
      });
    }
  };
  
  
  // Delete holiday by ID (ensure vendorId matches)
  exports.deleteHoliday = async (req, res) => {
    try {
      const { id } = req.params;
      const vendorId = req.payload.reqUserId;
      const holiday = await Holiday.findOneAndDelete({ _id: id, vendorId });
      if (!holiday) return res.status(404).json({ message: "Holiday not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };