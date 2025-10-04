const express = require('express')
const { register, loginSuperAdmin, getAllVendor, approveVendor, getCount, updatePassword, deleteAccount, createMembershipPlan, getMembershipPlans, getMembershipPlanById, updateMembershipPlan, deleteMembershipPlan, createCategory, getAllCategories, getCategoryById, updateCategoryById, deleteCategoryById, getAllSubscriptions, updateUserProfile, updateAdminProfile, getProfile, notificationsList, notificationsUnreadCount, notificationsMarkAllAsRead, getEmployeesByVendor, getEmployeeJobsByVendor, getEmployeesJobsTracking, updateTrackingTimeByAdmin, getDocuments, uploadDocument, deleteDocument } = require('../controller/superAdmin')
const { verifyToken } = require('../middleware/Auth')
const { getCatalogues, createCatalogue, updateCatalogue, deleteCatalogue, addSubcategory, updateSubcategory, deleteSubcategory, addItem, updateItem, deleteItem } = require('../controller/catalogueController')
const { getVendorsForCategory, updateCategoryAccess, getProductCategory } = require('../controller/admin/menuAccessController')
const { getAllTags, createTag, bulkActionTags } = require('../controller/blog/tagController')
const blogController = require('./../controller/blog/BlogController')
const superRouter = express.Router()
const BlogCategory = require("./../controller/blog/BlogCategoryController");
const moduleController = require("./../controller/admin/moduleController");

superRouter.get('/get-all-vendor', getAllVendor)


superRouter.get('/super-admin-register', register)

superRouter.post('/login-super-admin', loginSuperAdmin)


superRouter.put('/vendor-approval/:id', verifyToken, approveVendor)


// this is for getting count of each table
superRouter.get('/dashboard/data', verifyToken, getCount)
superRouter.get('/members/list', verifyToken, getAllVendor)

superRouter.put('/vendor-approval/:id', verifyToken, approveVendor)
superRouter.post('/members/:id/delete', verifyToken, deleteAccount)
superRouter.put('/members/password/:id', verifyToken, updatePassword)
superRouter.put('/members/profile/:id', verifyToken, updateUserProfile)
superRouter.get('/members/employees/:vendorId',verifyToken, getEmployeesByVendor);
superRouter.get('/members/employees/jobs/:vendorId/:employeeId',verifyToken, getEmployeeJobsByVendor);
superRouter.post('/employees/jobs/tracking',verifyToken, getEmployeesJobsTracking);
superRouter.post('/employee/assignedJobs/:jobId', verifyToken,updateTrackingTimeByAdmin)

// membership Routes
superRouter.post('/membership-plans/create', verifyToken, createMembershipPlan);
superRouter.get('/membership-plans', verifyToken, getMembershipPlans);
superRouter.get('/membership-plans/:id', verifyToken, getMembershipPlanById);
superRouter.post('/membership-plans/:id', verifyToken, updateMembershipPlan);
superRouter.delete('/membership-plans/:id', verifyToken, deleteMembershipPlan);

superRouter.post('/categories/create', verifyToken, createCategory);
superRouter.get('/categories', verifyToken, getAllCategories);
superRouter.get('/categories/:id', verifyToken, getCategoryById);
superRouter.post('/categories/:id', verifyToken, updateCategoryById);
superRouter.delete('/categories/:id', verifyToken, deleteCategoryById);

superRouter.put('/profile/update', verifyToken, updateAdminProfile);
superRouter.get('/profile', verifyToken, getProfile);


superRouter.get('/catalogues', getCatalogues);
// superRouter.get('/catalogues/:id', getCatalogueById);
superRouter.post('/catalogues', createCatalogue);
superRouter.put('/catalogues/:id', updateCatalogue);
superRouter.delete('/catalogues/:id', deleteCatalogue);

// Subcategory routes
superRouter.post('/catalogues/:catalogueId/subcategories', addSubcategory);
superRouter.put('/catalogues/:catalogueId/subcategories/:subcategoryId', updateSubcategory);
superRouter.delete('/catalogues/:catalogueId/subcategories/:subcategoryId', deleteSubcategory);

// Item routes
superRouter.post('/catalogues/:catalogueId/subcategories/:subcategoryId/items', addItem);
superRouter.put('/catalogues/:catalogueId/subcategories/:subcategoryId/items/:itemId', updateItem);
superRouter.delete('/catalogues/:catalogueId/subcategories/:subcategoryId/items/:itemId', deleteItem);

superRouter.get('/subscriptions', getAllSubscriptions);

superRouter.get('/notifications/list',verifyToken, notificationsList);
superRouter.get('/notifications/unreadCount',verifyToken, notificationsUnreadCount);
superRouter.get('/notifications/markAllAsRead', verifyToken,notificationsMarkAllAsRead);


superRouter.get('/product/documents', verifyToken , getDocuments);
superRouter.post('/product/documents/upload', verifyToken , uploadDocument);
superRouter.delete('/product/documents/:id', verifyToken , deleteDocument);


superRouter.get('/product/category/access', verifyToken,getVendorsForCategory);
superRouter.get('/product/categories', verifyToken,getProductCategory);
superRouter.post('/product/category/update-access', verifyToken,updateCategoryAccess);

superRouter.post('/blogs/tags', verifyToken,createTag);
superRouter.get('/blogs/tags', verifyToken,getAllTags);
superRouter.post('/blogs/tags/delete', verifyToken,bulkActionTags);


superRouter.get('/blogs/categories', verifyToken, BlogCategory.getAllCategories);
superRouter.post('/blogs/categories', verifyToken, BlogCategory.createCategory);
superRouter.post('/blogs/categories/delete', verifyToken, BlogCategory.bulkDeleteCategories);
superRouter.post('/blogs/categories/edit', verifyToken, BlogCategory.bulkUpdateCategories);
superRouter.put('/blogs/categories/:id', verifyToken, BlogCategory.updateCategory);
superRouter.delete('/blogs/categories/:id', verifyToken, BlogCategory.deleteCategory);

superRouter.post('/blogs',verifyToken , blogController.createBlog);
superRouter.get('/blogs',verifyToken , blogController.getBlogs);
superRouter.get('/blogs/:id',verifyToken , blogController.getBlog);
superRouter.put('/blogs/:id',verifyToken , blogController.updateBlog);
superRouter.delete('/blogs/:id',verifyToken , blogController.deleteBlog);
superRouter.delete('/blogs',verifyToken , blogController.deleteAllBlog);



superRouter.get("/modules", verifyToken,moduleController.getAllModules);
superRouter.post("/modules/set-price", verifyToken, moduleController.setModulePrice);
superRouter.post("/modules/isActive", verifyToken, moduleController.setStatus);
superRouter.get('/vendor/access/:vendorId',verifyToken, moduleController.getVendorAccess);
superRouter.post('/vendor/access/:vendorId', verifyToken, moduleController.updateVendorAccess);

superRouter.get('/seedMenuCategories',  moduleController.seedMenuCategories);
module.exports = superRouter;