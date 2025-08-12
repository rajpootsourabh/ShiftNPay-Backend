const express = require('express')
const { getAllEmploye, getEmpByVendroId,notificationsTest, deActivateEmp, getEmpById, empLogin, resetDefaultPasswordEmpId, updateEmpyFromVender, deleteJobFromEmp, deleteEmp, updateAbount, updateEmp, forgotPassword, updateProfileEmp,notificationsList,notificationsMarkAllAsRead } = require('../controller/employee')
const { verifyToken } = require('../middleware/Auth')
const { idValidationBody } = require('../middleware/jobValidation')
const empRouter = express.Router()

empRouter.get('/get-all', getAllEmploye)

// this api is for emp which get emp details by it's id
empRouter.get('/get-by-id/:id', /* verifyToken,  */getEmpById)

// getting employee using vendor id
empRouter.get('/get-by-vendor-id/:id', getEmpByVendroId)

// this is for deactivating emp from vendro side
empRouter.post('/emp-login', empLogin)


empRouter.post('/reset-password', verifyToken, resetDefaultPasswordEmpId)

// this is for vernder to update emp details like rate, capacity
empRouter.post('/updaet-emp-by-vender', verifyToken, updateEmpyFromVender)

// empRouter.post('/update-about', [verifyToken, idValidationBody], updateAbount)
empRouter.post('/update-about', idValidationBody, updateAbount)

// update emp from emp panel
empRouter.post('/update', updateEmp)


// this is for vender to remove job id which is assigned to a employee
empRouter.post('/remove-job-from-emp', verifyToken, deleteJobFromEmp)


empRouter.delete('/delete-emp/:id', deleteEmp)


empRouter.post('/forgot-password', forgotPassword)

empRouter.post('/profile-update', updateProfileEmp)



empRouter.post('/notifications/list', notificationsList);
empRouter.post('/notifications/markAllAsRead', notificationsMarkAllAsRead);
empRouter.post('/notifications/test', notificationsTest);

module.exports = empRouter