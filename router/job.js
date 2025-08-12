const express = require('express')
const { addJob, getAllJobs, deleteJob, getAllJobsForEmployeeByVendorAndEmpId, assignJobToEmpy, getAllJobsByEmpId, getActiveJobs, getSingleJobById, markJobCompleted, assignShift } = require('../controller/job')
const { jobValidation, idValidation, isValidationParams } = require('../middleware/jobValidation')
const { verifyToken } = require('../middleware/Auth')
const  authMiddleware  = require('../middleware/authMiddleware');
const {
    getUnassignedJobs,
    startAutoSchedule,
    getQueueStatus,
    respondToJobRequest,
    resetJobQueue,
    getJobRequest
  }  = require('../controller/jobAutoScheduleController')
const jobRouter = express.Router()

// this is api is for vendor
jobRouter.get('/get-all-jobs-id/:id', isValidationParams, getAllJobs)

jobRouter.get('/get-by-id/:id', getSingleJobById)

// this is api is for vendor
jobRouter.post('/add-job', jobValidation, addJob)
jobRouter.post('/assign-shift/:id', assignShift)

// this is api is for vendor
jobRouter.delete('/delete-job/:id', verifyToken, deleteJob)



// this is api for employee
jobRouter.get('/get-all-jobs', verifyToken, getAllJobsForEmployeeByVendorAndEmpId)

// this api for vender to assign a job to employee
jobRouter.post('/assign-job', verifyToken, assignJobToEmpy);
jobRouter.post('/mark-completed/:jobId', verifyToken, markJobCompleted);

jobRouter.get('/get-by-emp-id/:id', /* verifyToken, */ getAllJobsByEmpId)

jobRouter.get('/get-status-job/:id', getActiveJobs);


jobRouter.get('/unassigned', 
    authMiddleware.employer,  
    getUnassignedJobs
  );
  
  jobRouter.post('/:id/auto-schedule', 
    authMiddleware.employer,
    startAutoSchedule
  );
  
  jobRouter.get('/job-queues', 
    authMiddleware.employer,
    getQueueStatus
  );
  
  jobRouter.post('/job-queues/:id/reset', 
    authMiddleware.employer,
    resetJobQueue
  );
  
  // Employee routes
  jobRouter.post('/job-requests/:id/respond', 
    authMiddleware.employee,
    respondToJobRequest
  );

  jobRouter.get('/job-requests/check', 
    authMiddleware.employee,
    getJobRequest
  );
module.exports = jobRouter