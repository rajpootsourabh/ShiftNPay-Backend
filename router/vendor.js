const express = require('express')
const { registerVendor, loginVendor, createEmployeee, uploadProfileImage, getSingleVendorById, updateProfileUpdate, updateRestorauntProfile, getSingleRestorauntProfile, changePasswordByUserIdAndEmail, changePasswordById, dashboard, getAllEmpTrackingData, overTimeCalculations, updateExistingEmployeesWithEmpId, getCategoriesList, subscriptionPlans, createCheckoutSession, handleSuccessStripe, getCatalogues, getSubcategories, getItems, getReverseCategoryData, registerVendorFromAdmin, notificationsList, notificationsUnreadCount, notificationsMarkAllAsRead, createChecklist, getAllChecklists, addEmployeeChecklist, employeeChecklist, assignChecklistToEmployee, updateEmployeeChecklist, updateCheckList, getAssignedChecklists, deleteOnboardingCheckList, updateEmployeeChecklistSteps, getEmployeesJobsTrackingRequest, trackerRequestApprove, handleTimeTrackerRequest, getCurrentWeekShiftSchedules, getCurrentMonthShiftSchedules, getEmployeeList, getProfile } = require('../controller/vendor')
const { verifyToken } = require('../middleware/Auth')
const { isValidationParams } = require('../middleware/jobValidation')
const { uploadVendorDocument, getVendorDocuments, updateVendorDocument, deleteVendorDocument, assignDocumentToEmployee, deleteAssignedDocument } = require('../controller/vendorDocumentController')
const { assignDocument, getAssignedDocuments, downloadSubmittedDocument } = require('../controller/assignedDocumentController')
const vendorRouter = express.Router()
const Controllers = require('./../controller');
const authMiddleware = require('../middleware/authMiddleware');
const { getVendorCategoryAccess } = require('../controller/admin/menuAccessController')
const { getEmployeeCategoryAccess, getProductCategory, updateCategoryAccess, getVendorsEmployee, getEmployeesForCategory } = require('../controller/admin/empMenuAccessController')
const { getSubscriptionModules, createStripeCheckout, getSessionData, stripeWebhook, saveTransaction, getVendorModules, createTrialCheckout } = require('../controller/admin/moduleController')

vendorRouter.post('/register', registerVendor)
vendorRouter.post('/register-from-admin', registerVendorFromAdmin)

vendorRouter.post('/login', loginVendor)

// this is getting single vender data
vendorRouter.get('/get-by-id/:id', [verifyToken, isValidationParams], getSingleVendorById)

// this is for profile update of user only for image
vendorRouter.post('/update-profile-image', verifyToken, uploadProfileImage)

// this is for profile update of user not image only data
vendorRouter.post('/update-profile', verifyToken, updateProfileUpdate)

// creating employee using only email
vendorRouter.post('/create-emp', createEmployeee)
vendorRouter.get('/updateexistingRecords', updateExistingEmployeesWithEmpId)

// this is for resetting password
vendorRouter.post('/change-password-email-id', verifyToken, changePasswordByUserIdAndEmail)

// this is for restoraunt data apis
vendorRouter.get('/get-restoraunt-profile/:id', verifyToken, getSingleRestorauntProfile)

vendorRouter.post('/restoraunt-update', verifyToken, updateRestorauntProfile)

vendorRouter.post('/change-password', verifyToken, changePasswordById)

vendorRouter.get('/dashboard', verifyToken, dashboard);
vendorRouter.get('/shift-Schedule', verifyToken, getCurrentWeekShiftSchedules);
vendorRouter.get('/shift-Schedule/monthly', verifyToken, getCurrentMonthShiftSchedules);

vendorRouter.get('/categories', verifyToken, getCategoriesList);

vendorRouter.get('/overTimeCalculations', verifyToken, overTimeCalculations);
vendorRouter.get('/time-tracker-requests', verifyToken, getEmployeesJobsTrackingRequest);
vendorRouter.post('/time-tracker-requests/approve', verifyToken, trackerRequestApprove);
// vendorRouter.post('/time-tracker/request', handleTimeTrackerRequest);


// vendorRouter.get('/subscription-plans', verifyToken, subscriptionPlans)
vendorRouter.post('/create-checkout-session', verifyToken, createCheckoutSession)
vendorRouter.post('/stripe/handle-success', verifyToken, handleSuccessStripe)

vendorRouter.get('/catalogues', verifyToken, getCatalogues);
vendorRouter.get('/subcategories/:catalogueId', verifyToken, getSubcategories);
vendorRouter.get('/items/:subcategoryId', verifyToken, getItems);
vendorRouter.get('/items/reverse/:itemId', verifyToken, getReverseCategoryData);


vendorRouter.post('/notifications/list', notificationsList);
vendorRouter.post('/notifications/unreadCount', notificationsUnreadCount);
vendorRouter.post('/notifications/markAllAsRead', notificationsMarkAllAsRead);
vendorRouter.post('/checklists', verifyToken, createChecklist);
vendorRouter.post('/checklists/:id', verifyToken, updateCheckList);
vendorRouter.get('/checklists', verifyToken, getAllChecklists);

// vendorRouter.post('/add-employee-checklist',verifyToken, addEmployeeChecklist);
vendorRouter.post('/assign-checklist', verifyToken, addEmployeeChecklist);
vendorRouter.post('/delete-assign-checklist', verifyToken, deleteOnboardingCheckList);
vendorRouter.post('/update-checklist-steps', verifyToken, updateEmployeeChecklistSteps);

vendorRouter.get('/employee-checklist', verifyToken, getAssignedChecklists);


vendorRouter.post("/documents/upload", verifyToken, uploadVendorDocument);
vendorRouter.get("/documents", verifyToken, getVendorDocuments);
vendorRouter.put("/documents/:id", verifyToken, updateVendorDocument);
vendorRouter.delete("/documents/:id", verifyToken, deleteVendorDocument);
vendorRouter.get("/assignedDocuments", verifyToken, getAssignedDocuments);
vendorRouter.post("/assign-document", verifyToken, assignDocumentToEmployee);
vendorRouter.post("/delete-assign-assignedDocument", verifyToken, deleteAssignedDocument);


vendorRouter.get("/documents/download/:id", verifyToken, downloadSubmittedDocument);



vendorRouter.get('/employees', authMiddleware.employee, getEmployeeList);
vendorRouter.get('/categories/allowed', authMiddleware.employer, getVendorCategoryAccess);


vendorRouter.get('/product/category/access', authMiddleware.employer, getEmployeesForCategory);
vendorRouter.get('/product/categories', authMiddleware.employer, getProductCategory);
vendorRouter.post('/product/category/update-access', authMiddleware.employer, updateCategoryAccess);
vendorRouter.get('/employees/list', authMiddleware.employer, getVendorsEmployee);

vendorRouter.get("/subscription-plans", authMiddleware.employer, getSubscriptionModules);
vendorRouter.post("/checkout-session", authMiddleware.employer, createStripeCheckout);
vendorRouter.post("/create-trial-checkout", authMiddleware.employer, createTrialCheckout);
vendorRouter.get('/session/:sessionId', authMiddleware.employer, getSessionData);

vendorRouter.post('/module/transaction', authMiddleware.employer, saveTransaction);
vendorRouter.get('/my-modules', authMiddleware.employer, getVendorModules);
vendorRouter.get('/me', authMiddleware.employer, getProfile);
module.exports = vendorRouter