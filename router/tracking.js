const express = require('express')
const { createTrackingTime, updateTrackingTime, getTrackingTimeByUserId, getFromatedData, getAllEmpTrackingData, getSingleTrackingById, getAllEmpTrackingIds, getWeekHourByEmpId, getcurrentTimeOfTracker } = require('../controller/tracking')
const trackRouter = express.Router()

trackRouter.get('/get-tracking-by-user-id/:id', getTrackingTimeByUserId)

trackRouter.get('/get-by-id/:id', getSingleTrackingById)

trackRouter.post('/start-timer', createTrackingTime)

trackRouter.post('/pause-timer', updateTrackingTime)
trackRouter.get('/timer/:userId/:jobId', getcurrentTimeOfTracker)

trackRouter.get('/get-formated/:userId', getFromatedData)

// this is exporting to excel with all data
trackRouter.get('/get-all-emp-tracking-data', getAllEmpTrackingData)

trackRouter.get('/get-all-emp/:id', getAllEmpTrackingIds)

trackRouter.get('/get-week-hour/:id', getWeekHourByEmpId)

module.exports = trackRouter