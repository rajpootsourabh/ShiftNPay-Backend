const express = require('express')
const { verifyToken } = require('../middleware/Auth')
const {  updateLeaveForEmployee, getEmployeeLeaves, getAllEmployeeLeaves, getLeaveData, allotLeaveToEmployee , employeeAvailableLeaves, applyLeave, getConsumedLeavesWithStatus, getLeaveRequests, approveLeave, rejectLeave, getHolidaysByVendor, createHoliday, updateHoliday, deleteHoliday, getEmployeeHolidaysByVendor} = require('../controller/leavesController')
const { createLeaveType, getLeaveTypes, getLeaveTypeById, updateLeaveType, deleteLeaveType } = require('../controller/Leave/leaveTypeController')
const leaveRouter = express.Router()

// this is api is for vendor
leaveRouter.post('/assign-leave', verifyToken, allotLeaveToEmployee)
leaveRouter.put('/update-leave', verifyToken, updateLeaveForEmployee);
leaveRouter.get('/employee-leaves-list', verifyToken, getAllEmployeeLeaves);
leaveRouter.get('/history', verifyToken, getEmployeeLeaves);

leaveRouter.get('/available-leaves/:employeeId', employeeAvailableLeaves);
leaveRouter.get('/leavesHistory/:employeeId', getConsumedLeavesWithStatus);

leaveRouter.post('/apply', verifyToken, applyLeave);
leaveRouter.post('/types/', verifyToken, createLeaveType);
leaveRouter.get('/types/', verifyToken, getLeaveTypes);
leaveRouter.get('/types/:id', verifyToken, getLeaveTypeById);
leaveRouter.put('/types/:id', verifyToken, updateLeaveType);
leaveRouter.delete('/types/:id', verifyToken, deleteLeaveType);


leaveRouter.get('/employee-leave-requests', verifyToken, getLeaveRequests);
leaveRouter.post('/approve/:leaveManagementId/:leaveId', verifyToken, approveLeave);
leaveRouter.post('/reject/:leaveManagementId/:leaveId', verifyToken, rejectLeave);

leaveRouter.get("/holidays",verifyToken, getHolidaysByVendor); // Get holidays for a vendor
leaveRouter.get("/employee-holidays",verifyToken, getEmployeeHolidaysByVendor); // Get holidays for a vendor
leaveRouter.post("/holidays", verifyToken,createHoliday); // Create a holiday for a vendor
leaveRouter.post("/holidays/:id",verifyToken, updateHoliday); // Update holiday for a vendor
leaveRouter.delete("/holidays/:id", verifyToken,deleteHoliday); // Delete holiday for a vendor


module.exports = leaveRouter