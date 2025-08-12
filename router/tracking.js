const express = require('express')
const { createTrackingTime, updateTrackingTime, getTrackingTimeByUserId, getFromatedData, getAllEmpTrackingData, getSingleTrackingById, getAllEmpTrackingIds, getWeekHourByEmpId, getcurrentTimeOfTracker,getMonthlyTracking, getWeeklyTracking, getAllWeeklyTrackings, getAllMonthlyTrackings, getLastSixMonthsElapsedTime, handleBreakTime } = require('../controller/tracking')
const { verifyToken } = require('../middleware/Auth')
const trackRouter = express.Router()

trackRouter.get('/get-tracking-by-user-id/:id', getTrackingTimeByUserId)

trackRouter.get('/get-by-id/:id', getSingleTrackingById)

trackRouter.post('/start-timer', createTrackingTime)
trackRouter.post('/break-in', handleBreakTime)
trackRouter.post('/break-out', handleBreakTime)

trackRouter.post('/pause-timer', updateTrackingTime)
trackRouter.get('/timer/:userId/:jobId', getcurrentTimeOfTracker)

trackRouter.get('/get-formated/:userId', getFromatedData)

// this is exporting to excel with all data
trackRouter.get('/get-all-emp-tracking-data', getAllEmpTrackingData)

trackRouter.get('/get-all-emp/:id',verifyToken, getAllEmpTrackingIds)

trackRouter.get('/get-week-hour/:id', getWeekHourByEmpId)

trackRouter.post('/monthly/:year/:month',verifyToken, getMonthlyTracking);
trackRouter.post('/weekly/:year/:week',verifyToken, getWeeklyTracking);
trackRouter.post('/weekly/all', getAllWeeklyTrackings);
trackRouter.post('/monthly/all', getAllMonthlyTrackings);
trackRouter.get('/monthly-average/:userId', getLastSixMonthsElapsedTime);
module.exports = trackRouter