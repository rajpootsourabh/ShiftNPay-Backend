const express = require('express')
const { addShift, deleteShift, getShiftSingle, getAllShifts, assignShiftToEmp, removeAssignShiftToEmp, updateShift } = require('../controller/shift')
const { verifyToken } = require('../middleware/Auth')
const shiftRouter = express.Router()

shiftRouter.get('/get-by-id/:id', getShiftSingle)

shiftRouter.get('/get-all/',verifyToken, getAllShifts)

shiftRouter.post('/add',verifyToken, addShift)

shiftRouter.put('/update/:id',verifyToken, updateShift)

shiftRouter.delete('/delete/:id', deleteShift)

shiftRouter.post('/assign', assignShiftToEmp)

shiftRouter.post('/remove-assign', removeAssignShiftToEmp)

module.exports = shiftRouter