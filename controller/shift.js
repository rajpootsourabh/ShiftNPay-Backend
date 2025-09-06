const Employee = require("../model/Employee");
const moment = require( 'moment-timezone');
const Shift = require("../model/Shift");
const User = require("../model/User");
const { EmployeeModel } = require("../model");

exports.getShiftSingle = async (req, res) => {
    const id = req.params.id

    try {
        const result = await Shift.findById(id).select("-__v -updatedAt -userId")
        if (result) {
            return res.status(200).json({ msg: 'Ok', success: true, result })
        }
        return res.status(404).json({ msg: 'No shift data found!', success: false })
    } catch (error) {
        //console.log("error on getShiftData: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.getAllShifts = async (req, res) => {
    const id = req.payload.reqUserId
    try {
        const checkVedor = await User.findById(id)
        if (!checkVedor) {
            return res.status(403).json({ msg: 'Access Forbidden!', success: false })
        }

        const result = await Shift.find({ userId: id }).select("-__v -updatedAt -userId").sort({ createdAt: -1 })
        if (result) {
            return res.status(200).json({ msg: 'Ok', success: true, result })
        }
        return res.status(404).json({ msg: 'No shifts found!', success: false })
    } catch (error) {
        //console.log("error on getAllShifts: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.getAllShiftsOfEmployee = async (req, res) => {
    const id = req.params.empId
    try {

        const result = await EmployeeModel.findById(id).populate({
    path: "jobId",
    populate: {
      path: "shift",   // <-- populate inside job
    },
  });
        if (result) {
            return res.status(200).json({ msg: 'Ok', success: true, result })
        }
        return res.status(404).json({ msg: 'No shifts found!', success: false })
    } catch (error) {
        //console.log("error on getAllShifts: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.addShift = async (req, res) => {
    const { name, start, end, timezone } = req.body;
    const userId = req.payload.reqUserId;
    
    try {
        // Validate required fields
        if (!name || !start || !end || !timezone) {
            return res.status(400).json({ 
                msg: 'Missing required fields: name, start, end, or timezone', 
                success: false 
            });
        }

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(403).json({ 
                msg: 'Access Forbidden! User not found.', 
                success: false 
            });
        }

        // Convert local times to UTC
        const utcStart = moment.tz(start, timezone).utc().toISOString();
        const utcEnd = moment.tz(end, timezone).utc().toISOString();

        // Validate end time is after start time
        if (moment(utcEnd).isSameOrBefore(moment(utcStart))) {
            return res.status(400).json({ 
                msg: 'End time must be after start time', 
                success: false 
            });
        }

        // Create the shift with both local and UTC times
        const result = await Shift.create({ 
            name, 
            start: utcStart,
            end: utcEnd,
            timezone,
            utcStart, // Store UTC equivalent for querying
            utcEnd,   // Store UTC equivalent for querying
            userId 
        });

        if (result) {
            return res.status(200).json({ 
                msg: 'Shift added successfully', 
                success: true,
                data: {
                    ...result._doc,
                    localStart: start, // Return original local times
                    localEnd: end
                }
            });
        }

        return res.status(400).json({ 
            msg: 'Failed to add shift', 
            success: false 
        });

    } catch (error) {
        console.error("Error in addShift:", error);
        return res.status(500).json({ 
            msg: 'Internal server error',
            error: error.message, 
            success: false 
        });
    }
};


exports.updateShift = async (req, res) => {
    const { id } = req.params;
    const { name, start, end } = req.body;
    const userId = req.payload.reqUserId;

    try {
        const checkVendor = await User.findById(userId);
        if (!checkVendor) {
            return res.status(403).json({ msg: 'Access Forbidden!', success: false });
        }

        const existingShift = await Shift.findOne({ _id: id, userId });
        if (!existingShift) {
            return res.status(404).json({ msg: 'Shift not found or unauthorized', success: false });
        }

        const updatedShift = await Shift.findByIdAndUpdate(
            id,
            { name, start, end },
            { new: true } // Return the updated document
        );

        if (updatedShift) {
            return res.status(200).json({ 
                msg: 'Shift updated successfully', 
                success: true,
                data: updatedShift
            });
        }

        return res.status(400).json({ msg: 'Failed to update shift', success: false });
    } catch (error) {
        console.error("Error in updateShift: ", error);
        return res.status(500).json({ 
            msg: error.message, 
            err: error, 
            success: false 
        });
    }
};


exports.deleteShift = async (req, res) => {
    //console.log("req.params: ", req.params);
    const id = req.params.id

    try {
        const checkShift = await Shift.findById(id)
        if (!checkShift) {
            return res.status(404).json({ msg: 'No shift data found!', success: false })
        }
        const result = await Shift.findByIdAndDelete(id)
        if (result) {
            return res.status(200).json({ msg: `Shift ${checkShift?.name} deleted successfully.`, success: false })
        }
        return res.status(400).json({ msg: 'Failed to delete shift!', success: false })
    } catch (error) {
        //console.log("error on deleteShift: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


/* exports.assignShiftToEmp = async (req, res) => {
    //console.log("req.body: ", req.body);
    const id = req.body.id
    const empId = req.body.empId

    try {
        const checkShift = await Shift.findById(id)
        if (!checkShift) {
            return res.status(404).json({ msg: 'No shift data found!', success: false })
        }
        const checkEmp = await Employee.findById(empId)
        if (!checkEmp) {
            return res.status(403).json({ msg: 'Access Forbidden!', success: false })
        }

        const shiftExists = checkEmp.shift.some(id => id.equals(id));
        if (shiftExists) {
            return res.status(403).json({ msg: `Shift ${checkShift?.name} already exists!`, success: false })
        }
        checkEmp.shift.push(id);
        await checkEmp.save();
        // Find the employee by ID
        const employee = await Employee.findById(empId);

        if (!employee) {
            return { success: false, message: 'Employee not found' };
        }

        const checkShift = await Shift.findById(id)
        if (!checkShift) {
            return res.status(404).json({ msg: 'No shift data found!', success: false })
        }

        // Check if the shift already exists
        const shiftExists = employee.shift.some(id => id.equals(id));
        if (shiftExists) {
            return res.status(400).json({ msg: `Shift ${checkShift?.name} already exists!`, success: false })
        }

        // Add the shift and save the employee
        employee.shift.push(id);
        await employee.save();

        return res.status(200).json({ msg: `Shift ${checkShift?.name} added successfully.`, success: true })
    } catch (error) {
        //console.log("error on assignShiftToEmp: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
} */

exports.assignShiftToEmp = async (req, res) => {
    // //console.log("req.body: ", req.body);
    const shiftId = req.body.id;
    const empId = req.body.empId;

    try {
        // Find the employee by ID
        const employee = await Employee.findById(empId);

        if (!employee) {
            return res.status(404).json({ msg: 'Employee not found', success: false });
        }

        // Find the shift by ID
        const checkShift = await Shift.findById(shiftId);
        if (!checkShift) {
            return res.status(404).json({ msg: 'No shift data found!', success: false });
        }

        // Check if the shift already exists
        const shiftExists = employee.shift.some(shift => shift.equals(shiftId));
        if (shiftExists) {
            return res.status(400).json({ msg: `Shift ${checkShift.name} already exists!`, success: false });
        }

        // Add the shift and save the employee
        employee.shift.push(shiftId);
        await employee.save();

        return res.status(200).json({ msg: `Shift ${checkShift.name} added successfully.`, success: true });
    } catch (error) {
        //console.log("error on assignShiftToEmp: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false });
    }
};


exports.removeAssignShiftToEmp = async (req, res) => {
    // //console.log("req.body: ", req.body);
    const id = req.body.id
    const empId = req.body.empId
    try {
        const employee = await Employee.findById(empId)
        if (!employee) {
            return res.status(404).json({ msg: 'No employee data found!', success: false })
        }

        const checkShift = await Shift.findById(id)
        if (!checkShift) {
            return res.status(404).json({ msg: 'No shift data found!', success: false })
        }

        // Check if the shift exists
        const shiftIndex = employee.shift.findIndex(id => id.equals(id));
        if (shiftIndex === -1) {
            return { success: false, message: 'Shift not found' };
        }

        // Remove the shift and save the employee
        employee.shift.splice(shiftIndex, 1);
        await employee.save();

        return res.status(200).json({ msg: `${checkShift?.name} removed successfully.`, success: true });
    } catch (error) {
        //console.log("error on removeAssignShiftToEmp: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}