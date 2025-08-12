const express = require('express')
const { getAllEmploye, getEmpByVendroId,notificationsTest, deActivateEmp,testNotificationCreate, getEmpById, empLogin, notificationsUnreadCount, resetDefaultPasswordEmpId, updateEmpyFromVender, deleteJobFromEmp, deleteEmp, updateAbount, updateEmp, forgotPassword, updateProfileEmp,notificationsList,notificationsMarkAllAsRead, getProfile, updateProfile, assignedJobs, closeAssignedJob, getTrackingRequestStatus, dashboard, getColleagues } = require('../controller/employee')
const { verifyToken } = require('../middleware/Auth')
const { idValidationBody } = require('../middleware/jobValidation')
const { uploadCompletedDocument, getSubmittedDocuments, getAssignedDocumentsToEmployee, uploadDoucmentByEmployee } = require('../controller/assignedDocumentController')
const { getEmployeeCategoryAccess } = require('../controller/admin/empMenuAccessController')
const empRouter = express.Router()
const  authMiddleware  = require('../middleware/authMiddleware');
const blogController = require('./../controller/blog/BlogController')

empRouter.get('/dashboard/:id', dashboard);
empRouter.get('/get-all', getAllEmploye)
empRouter.get('/colleagues',verifyToken, getColleagues)

// this api is for emp which get emp details by it's id
empRouter.get('/get-by-id/:id', /* verifyToken,  */getEmpById)

// getting employee using vendor id
empRouter.get('/get-by-vendor-id',verifyToken, getEmpByVendroId)

// this is for deactivating emp from vendro side
empRouter.post('/emp-login', empLogin)


empRouter.post('/reset-password', verifyToken, resetDefaultPasswordEmpId)

// this is for vernder to update emp details like rate, capacity
empRouter.post('/updaet-emp-by-vender', verifyToken, updateEmpyFromVender)

// empRouter.post('/update-about', [verifyToken, idValidationBody], updateAbount)
empRouter.post('/update-about', idValidationBody, updateAbount)

// update emp from emp panel
empRouter.get('/profile/:id', getProfile)
empRouter.post('/profile/:id', updateProfile)


// this is for vender to remove job id which is assigned to a employee
empRouter.post('/remove-job-from-emp', verifyToken, deleteJobFromEmp)


empRouter.delete('/delete-emp/:id', deleteEmp)


empRouter.post('/forgot-password', forgotPassword)

empRouter.post('/profile-update', updateProfileEmp)



empRouter.post('/notifications/list', notificationsList);
empRouter.post('/notifications/unreadCount', notificationsUnreadCount);
empRouter.post('/notifications/markAllAsRead', notificationsMarkAllAsRead);
empRouter.post('/notifications/test', notificationsTest);
empRouter.get('/notifications/send/:id', testNotificationCreate);
empRouter.get('/assignedJobs',verifyToken, assignedJobs);
empRouter.put('/assignedJobs/:jobId',verifyToken, closeAssignedJob);

empRouter.get('/time-tracker-requests', verifyToken, getTrackingRequestStatus);


empRouter.post("/documents/upload/:id", uploadCompletedDocument);
empRouter.get("/documents/submitted/:vendorId", getSubmittedDocuments);


empRouter.get("/assignedDocuments",verifyToken, getAssignedDocumentsToEmployee);
empRouter.post("/uploadDoucment",verifyToken, uploadDoucmentByEmployee);

empRouter.get('/categories/allowed', authMiddleware.employee,getEmployeeCategoryAccess);

empRouter.get('/blogs',blogController.getBlogsForUsers);
empRouter.get('/blogs/:id',blogController.getBlog);
module.exports = empRouter