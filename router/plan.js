const express = require('express')
const { addAndUpdateOfPlan, getAllPlans, getSinglePlans, deletePlanById } = require('../controller/plan')
const planRouter = express.Router()

planRouter.get('/get-plan', getAllPlans)

planRouter.get('/get-single-by-id/:id', getSinglePlans)

planRouter.post('/add-plan', addAndUpdateOfPlan)

planRouter.put('/update-plan/:id', addAndUpdateOfPlan)


planRouter.delete('/delete-by-id/:id', deletePlanById)

module.exports = planRouter