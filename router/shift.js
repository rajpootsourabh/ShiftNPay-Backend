const express = require('express')
const { addShift, deleteShift, getShiftSingle, getAllShifts,getAllShiftsOfEmployee,  assignShiftToEmp, removeAssignShiftToEmp, updateShift } = require('../controller/shift')
const { verifyToken } = require('../middleware/Auth')
const shiftRouter = express.Router()
const authMiddleware = require('../middleware/authMiddleware');

shiftRouter.get('/get-by-id/:id', getShiftSingle)

shiftRouter.get('/get-all/',verifyToken, getAllShifts)

shiftRouter.post('/add',verifyToken, addShift)

shiftRouter.get('/getEmployeeShifts/:empId',authMiddleware.employer, getAllShiftsOfEmployee)

shiftRouter.put('/update/:id',verifyToken, updateShift)

shiftRouter.delete('/delete/:id', deleteShift)

shiftRouter.post('/assign', assignShiftToEmp)

shiftRouter.post('/remove-assign', removeAssignShiftToEmp)

module.exports = shiftRouter