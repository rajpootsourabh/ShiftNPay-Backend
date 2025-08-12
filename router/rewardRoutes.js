const express = require('express');
const router = express.Router();
const Controllers = require('./../controller');
const  authMiddleware  = require('../middleware/authMiddleware');
// Configuration routes
router.get('/config', authMiddleware.employer, Controllers.RewardController.getRewardConfig);
router.put('/config', authMiddleware.employer, Controllers.RewardController.updateRewardConfig);


// Employee reward endpoints
router.get('/employee/:employeeId', authMiddleware.employee, Controllers.RewardController.getEmployeeRewards);
router.post('/:rewardId/redeem', authMiddleware.employee, Controllers.RewardController.redeemReward);



// Reward calculation
router.post('/calculate', authMiddleware.employer, Controllers.RewardController.calculateWeeklyRewards);

// Reward redemption
router.post('/:rewardId/request-vacation', authMiddleware.employee, Controllers.RewardController.redeemAsVacation);
router.post('/:rewardId/request-donation', authMiddleware.employee, Controllers.RewardController.requestDonation);

router.get('/requests', authMiddleware.employer, Controllers.RewardController.getRequests);
router.post('/requests/:requestId/approve', authMiddleware.employer, Controllers.RewardController.approveRequest);
router.post('/requests/:requestId/reject', authMiddleware.employer, Controllers.RewardController.rejectRequest);

// Donation requests
router.get('/history', authMiddleware.employer, Controllers.RewardController.rewardHistory);
// router.post('/requests/:requestId/:action(approve|reject)', authMiddleware.employer, Controllers.RewardController.processDonationRequest);

module.exports = router;