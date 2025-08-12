const express = require('express')
const { addJob, getAllJobs, deleteJob, getAllJobsForEmployeeByVendorAndEmpId, assignJobToEmpy, getAllJobsByEmpId, getActiveJobs, getSingleJobById } = require('../controller/job')
const { jobValidation, idValidation, isValidationParams } = require('../middleware/jobValidation')
const { verifyToken } = require('../middleware/Auth')
const jobRouter = express.Router()

// this is api is for vendor
jobRouter.get('/get-all-jobs-id/:id', isValidationParams, getAllJobs)

jobRouter.get('/get-by-id/:id', getSingleJobById)

// this is api is for vendor
jobRouter.post('/add-job', jobValidation, addJob)

// this is api is for vendor
jobRouter.delete('/delete-job/:id', verifyToken, deleteJob)



// this is api for employee
jobRouter.get('/get-all-jobs', verifyToken, getAllJobsForEmployeeByVendorAndEmpId)

// this api for vender to assign a job to employee
jobRouter.post('/assign-job', verifyToken, assignJobToEmpy)

jobRouter.get('/get-by-emp-id/:id', /* verifyToken, */ getAllJobsByEmpId)

jobRouter.get('/get-status-job/:id', getActiveJobs)


module.exports = jobRouter