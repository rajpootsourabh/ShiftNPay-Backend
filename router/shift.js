const express = require('express')
const { addShift, deleteShift, getShiftSingle, getAllShifts, assignShiftToEmp, removeAssignShiftToEmp } = require('../controller/shift')
const shiftRouter = express.Router()

shiftRouter.get('/get-by-id/:id', getShiftSingle)

shiftRouter.get('/get-all/:id', getAllShifts)

shiftRouter.post('/add', addShift)

shiftRouter.post('/update', addShift)

shiftRouter.delete('/delete/:id', deleteShift)

shiftRouter.post('/assign', assignShiftToEmp)

shiftRouter.post('/remove-assign', removeAssignShiftToEmp)

module.exports = shiftRouter