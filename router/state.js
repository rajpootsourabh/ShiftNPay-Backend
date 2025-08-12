const express = require('express')
const { getStateByVendorId, getSingleStateById, addState, updateState, deleteState } = require('../controller/state')
const stateRouter = express.Router()

// geting by vendorId
stateRouter.get('/get-all/:id', getStateByVendorId)

stateRouter.get('/get-single/:id', getSingleStateById)

stateRouter.post('/add-state', addState)

stateRouter.post('update-state', updateState)

stateRouter.delete('/delete-state/:id', deleteState)

module.exports = stateRouter