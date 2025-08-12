const express = require('express')
const { getByEmpId, addFeedBack, updateFeedBack } = require('../controller/feedBack')
const feedRouter = express.Router()

feedRouter.get('/get-by-emp-id/:id', getByEmpId)

feedRouter.post('/add-feed', addFeedBack)

feedRouter.post('/update-feed', updateFeedBack)

module.exports = feedRouter