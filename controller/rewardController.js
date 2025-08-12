const { startOfWeek, endOfWeek, subWeeks } = require('date-fns');
const RewardConfig = require('../model/RewardConfig');
const WeeklyReward = require('../model/WeeklyReward');
const RewardRedemption = require('../model/RewardRedemption');
const Tracking = require('../model/Tracking');
const Employee = require('../model/Employee');
const Services = require('./../services');
const User = require('../model/User');
exports.getRewardConfig = async (req, res) => {
  try {
    const config = await RewardConfig.findOneAndUpdate(
      { employerId: req.user._id },
      {},
      { upsert: true, new: true }
    );
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.updateRewardConfig = async (req, res) => {
  try {
    const config = await RewardConfig.findOneAndUpdate(
      { employerId: req.user._id },
      req.body,
      { new: true }
    );
    res.json(config);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.calculateWeeklyRewards = async (req, res) => {
  try {
    const config = await RewardConfig.findOne({ employerId: req.user._id });
    if (!config || !config.isActive) {
      return res.status(400).json({ message: 'Reward system is not active' });
    }

    const now = new Date();
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday 00:00
    const currentWeekEnd = now; // Current moment

    const employees = await Employee.find({ userId: req.user._id });
    const employeeIds = employees.map(emp => emp._id);

    const results = await Tracking.aggregate([
      {
        $match: {
          userId: { $in: employeeIds },
          createdAt: {
            $gte: currentWeekStart,
            $lte: currentWeekEnd
          },
        }
      },
      {
        $project: {
          userId: 1,
          workedTime: { $subtract: ["$elapsedTime", "$totalBreakTime"] }
        }
      },
      {
        $group: {
          _id: "$userId",
          totalWorkedHours: { $sum: { $divide: ["$workedTime", 3600] } }
        }
      }
    ]);

    const response = await Promise.all(employees.map(async employee => {
      const result = results.find(r => r._id.equals(employee._id));
      const workedHours = result?.totalWorkedHours || 0;
      const bonusHours = workedHours >= config.thresholdHours
        ? (workedHours / config.thresholdHours) * config.rewardHours
        : 0;
      const status = "pending"; // Default status

      await WeeklyReward.findOneAndUpdate(
        {
          employerId: req.user._id,
          employeeId: employee._id,
          weekStartDate: currentWeekStart
        },
        {
          employeeName: `${employee.firstName} ${employee.lastName}`,
          weekEndDate: currentWeekEnd,
          totalWorkedHours: workedHours,
          bonusHours,
          status,
          thresholdHours: config.thresholdHours,
          isCurrentWeek: true
        },
        { upsert: true, new: true }
      );

      return {
        employeeId: employee._id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        weekStartDate: currentWeekStart,
        weekEndDate: currentWeekEnd,
        totalWorkedHours: workedHours,
        bonusHours,
        status,
        thresholdHours: config.thresholdHours,
        isEligible: workedHours >= config.thresholdHours
      };
    }));

    res.json({
      success: true,
      weekRange: {
        start: currentWeekStart,
        end: currentWeekEnd
      },
      rewards: response,
      config: {
        thresholdHours: config.thresholdHours,
        rewardHours: config.rewardHours
      }
    });

  } catch (err) {
    console.error('Error in calculateWeeklyRewards:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate weekly rewards',
      error: err.message
    });
  }
};
exports.redeemAsVacation = async (req, res) => {
  try {
    const { startDate, endDate, notes, hours } = req.body;
    const rewardId = req.params.rewardId;
    const employeeId = req.user._id;
    const employerId = req.user.userId;

    // 1. Validate reward exists and is eligible
    const reward = await WeeklyReward.findOne({
      _id: rewardId,
      employerId,
      employeeId,
      status: { $in: ['approved', 'partially_redeemed'] } // Allow partial redemptions
    });

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found or not eligible for redemption'
      });
    }

    // 2. Validate available hours
    const availableHours = reward.bonusHours - (reward.redeemedHours || 0);
    if (availableHours < hours) {
      return res.status(400).json({
        success: false,
        message: `Not enough bonus hours available (${availableHours} remaining)`
      });
    }

    // 3. Check organization configuration
    const config = await RewardConfig.findOne({ employerId });
    if (!config?.allowVacation) {
      return res.status(400).json({
        success: false,
        message: 'Vacation redemption is not enabled'
      });
    }

    // 4. Create redemption record (no longer checking for existing redemptions)
    const redemption = await RewardRedemption.create({
      rewardId,
      employerId,
      employeeId,
      redemptionType: 'vacation',
      hoursRedeemed: hours,
      status: 'pending',
      requestMessage: `Vacation request for ${hours} hours`,
      vacationDetails: {
        startDate,
        endDate,
        notes
      }
    });

    let employee = await Employee.findById({ _id: employeeId });
    let vendor = await User.findById({ _id: employerId });

    await Services.NotificationService.sendNotification(vendor._id, vendor?.device_token, 'Reward Redeem Request', `${employee.name} has Submitted Reward Redeem Request.`);

    res.status(201).json({
      success: true,
      message: 'Vacation redemption request submitted for approval',
      data: redemption
    });

  } catch (err) {
    console.log(err.message)
    res.status(500).json({
      success: false,
      message: 'Failed to process vacation redemption request',
      error: err.message
    });
  }
};
exports.requestDonation = async (req, res) => {
  try {
    const { recipientId, hours, message } = req.body;
    const rewardId = req.params.rewardId;
    const donorId = req.user._id;
    const employerId = req.user.userId;

    // 1. Validate organization allows donations
    const config = await RewardConfig.findOne({ employerId });
    if (!config?.allowDonations) {
      return res.status(403).json({
        success: false,
        message: 'Hour donations are not enabled'
      });
    }

    // 2. Validate reward exists and is eligible
    const reward = await WeeklyReward.findOne({
      _id: rewardId,
      employerId,
      employeeId: donorId,
      status: { $in: ['approved', 'partially_redeemed'] } // Allow partial redemptions
    });

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found or not eligible for donation'
      });
    }

    // 3. Validate available hours
    const availableHours = reward.bonusHours - (reward.redeemedHours || 0);
    if (availableHours < hours || hours <= 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid hours amount (${availableHours} remaining)`
      });
    }

    // 4. Validate recipient
    const recipient = await Employee.findOne({
      _id: recipientId,
      userId: employerId
    });

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    // 5. Create donation request (no longer checking for existing redemptions)
    const donation = await RewardRedemption.create({
      rewardId,
      employerId,
      employeeId: donorId,
      redemptionType: 'donation',
      hoursRedeemed: hours,
      status: 'pending',
      requestMessage: message,
      donationDetails: {
        recipientId,
        recipientName: `${recipient.firstName} ${recipient.lastName}`,
        recipientEmail: recipient.email,
        recipientPhone: recipient.phone,
        message
      }
    });

    let employee = await Employee.findById({ _id: donorId });
    let vendor = await User.findById({ _id: employerId });

    await Services.NotificationService.sendNotification(vendor._id, vendor?.device_token, 'Reward Redeem Request', `${employee.name} has Submitted Reward Redeem Request.`);


    res.status(201).json({
      success: true,
      message: 'Donation request submitted for approval',
      data: donation
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to process donation request',
      error: err.message
    });
  }
};
exports.approveRedemption = async (req, res) => {
  try {
    const redemptionId = req.params.redemptionId;
    const adminId = req.user._id;

    // 1. Find the redemption request
    const redemption = await RewardRedemption.findById(redemptionId);
    if (!redemption) {
      return res.status(404).json({
        success: false,
        message: 'Redemption request not found'
      });
    }

    // 2. Validate reward is still available
    const reward = await WeeklyReward.findOne({
      _id: redemption.rewardId,
      status: 'approved'
    });

    if (!reward) {
      return res.status(400).json({
        success: false,
        message: 'Reward no longer available for redemption'
      });
    }

    // 3. Validate sufficient hours
    if (reward.bonusHours < redemption.hoursRedeemed) {
      return res.status(400).json({
        success: false,
        message: 'Not enough bonus hours available'
      });
    }

    // 4. Update redemption status
    redemption.status = 'approved';
    redemption.processedBy = adminId;
    redemption.processedAt = new Date();
    await redemption.save();

    // 5. Update reward status
    reward.status = 'redeemed';
    reward.redemptionType = redemption.redemptionType;
    reward.redeemedAt = new Date();
    await reward.save();

    let employee = await Employee.findById({ _id: redemption.employeeId });
    let vendor = await User.findById({ _id: adminId });

    await Services.NotificationService.sendNotification(employee._id, employee.device_token, 'Request Approved!', `${vendor.name} has Approved your redeem request.`);

    res.json({
      success: true,
      message: 'Redemption request approved successfully',
      data: {
        redemption,
        reward
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to approve redemption',
      error: err.message
    });
  }
};
exports.rejectRedemption = async (req, res) => {
  try {
    const { redemptionId } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.user._id;

    const redemption = await RewardRedemption.findByIdAndUpdate(
      redemptionId,
      {
        status: 'rejected',
        processedBy: adminId,
        processedAt: new Date(),
        rejectionReason
      },
      { new: true }
    );

    if (!redemption) {
      return res.status(404).json({
        success: false,
        message: 'Redemption request not found'
      });
    }
    let employee = await Employee.findById({ _id: redemption.employeeId });
    let vendor = await User.findById({ _id: adminId });

    await Services.NotificationService.sendNotification(employee._id, employee.device_token, 'Request Rejected!', `${vendor.name} has Rejected your redeem request.`);
    res.json({
      success: true,
      message: 'Redemption request rejected',
      data: redemption
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to reject redemption',
      error: err.message
    });
  }
};
exports.getEmployeeRewards = async (req, res) => {
  try {
    const employeeId = req.params.employeeId;

    const [earnedRewards, redemptionRequests, donationRequests] = await Promise.all([
      WeeklyReward.find({ employeeId, status: { $in: ['approved', 'processed'] }, }).sort({ weekStartDate: -1 }).lean(),
      RewardRedemption.find({
        employeeId,
        status: { $in: ['approved', 'processed'] },
        redemptionType: { $in: ['vacation', 'payout'] }
      }).lean(),
      RewardRedemption.find({
        employeeId,
        status: { $in: ['approved', 'processed'] },
        redemptionType: 'donation'
      }).lean()
    ]);

    // Calculate totals and available hours for each reward
    const processedEarned = earnedRewards.map(reward => {
      // Find all redemptions for this specific reward
      const rewardRedemptions = redemptionRequests.filter(r => r.rewardId?.equals(reward._id));
      const rewardDonations = donationRequests.filter(d => d.rewardId?.equals(reward._id));

      const redeemedHours = rewardRedemptions.reduce((sum, r) => sum + (r.hoursRedeemed || 0), 0);
      const donatedHours = rewardDonations.reduce((sum, d) => sum + (d.hoursRedeemed || 0), 0);
      const availableHours = Math.max(0, (reward.bonusHours || 0) - redeemedHours - donatedHours);

      return {
        ...reward,
        calculated: {
          redeemedHours,
          donatedHours,
          availableHours,
          isFullyRedeemed: availableHours <= 0
        }
      };
    });

    // Calculate totals
    const totalEarned = earnedRewards.reduce((sum, r) => sum + (r.bonusHours || 0), 0);
    const totalRedeemed = redemptionRequests.reduce((sum, r) => sum + (r.hoursRedeemed || 0), 0);
    const totalDonated = donationRequests.reduce((sum, d) => sum + (d.hoursRedeemed || 0), 0);
    const totalAvailable = processedEarned.reduce((sum, r) => sum + r.calculated.availableHours, 0);

    // Prepare pending requests (both vacation and donations)
    const pendingRequests = await RewardRedemption.find({
      employeeId,
      status: 'pending'
    }).lean();

    // Prepare response
    const response = {
      earned: processedEarned,
      redemptions: redemptionRequests.map(r => ({
        ...r,
        calculated: {
          redeemedHours: r.hoursRedeemed || 0
        }
      })),
      donations: donationRequests.map(d => ({
        ...d,
        calculated: {
          donatedHours: d.hoursRedeemed || 0
        }
      })),
      pending: pendingRequests,
      totals: {
        earned: totalEarned,
        redeemed: totalRedeemed,
        donated: totalDonated,
        available: totalAvailable - pendingRequests.reduce((sum, p) => sum + (p.hoursRedeemed || 0), 0),
        pending: pendingRequests.reduce((sum, p) => sum + (p.hoursRedeemed || 0), 0)
      }
    };

    res.json(response);

  } catch (err) {
    console.error('Error in getEmployeeRewards:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reward data',
      error: err.message
    });
  }
};
exports.redeemReward = async (req, res) => {
  try {
    const reward = await WeeklyReward.findOneAndUpdate(
      {
        _id: req.params.rewardId,
        employeeId: req.user._id,
        status: 'approved'
      },
      {
        status: 'redeemed',
        redemptionType: req.body.type,
        redeemedAt: new Date()
      },
      { new: true }
    );

    if (!reward) {
      return res.status(404).json({ message: 'Reward not found or already redeemed' });
    }

    res.json(reward);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getColleagues = async (req, res) => {
  try {
    const colleagues = await Employee.find({
      employerId: req.user.employerId,
      _id: { $ne: req.user._id }
    }).select('name position');

    res.json(colleagues);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getRequests = async (req, res) => {
  try {
    const requests = await RewardRedemption.find({
      employerId: req.user._id,
      status: 'pending'
    })
      .populate('employeeId', 'firstName lastName name email position')
      .populate('employerId', 'name email position')
      .populate('donationDetails.recipientId', 'name email position');

    res.json(requests);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch redemption requests',
      error: error.message
    });
  }
};
exports.rewardHistory = async (req, res) => {
  try {
    const redemptions = await RewardRedemption.find({
      employerId: req.user._id,
      status: { $in: ['approved', 'rejected'] },
    })
      .sort({ createdAt: -1 }) // Newest first
      .populate('rewardId', 'name value') // Include reward details
      .populate('employeeId', 'firstName lastName  name'); // Include employee details

    res.json(redemptions);

  } catch (error) {
    console.error('Error fetching reward redemptions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reward redemptions'
    });
  }
}
exports.approveRequest = async (req, res) => {
  try {
    const request = await RewardRedemption.findOneAndUpdate(
      {
        _id: req.params.requestId,
        employerId: req.user._id,
        status: 'pending'
      },
      {
        status: 'approved',
        processedBy: req.user._id,
        processedAt: new Date()
      },
      { new: true }
    )
      .populate('employeeId', 'name email position')
      .populate('donationDetails.recipientId', 'name email position');

    if (!request) {
      return res.status(404).json({ message: 'Pending request not found' });
    }

    // Handle the approved redemption based on type
    if (request.redemptionType === 'donation') {
      // Transfer hours from donor to recipient
      await Promise.all([
        Employee.findByIdAndUpdate(request.employeeId, {
          $inc: { bonusHours: -request.hoursRedeemed }
        }),
        Employee.findByIdAndUpdate(request.donationDetails.recipientId, {
          $inc: { bonusHours: request.hoursRedeemed }
        })
      ]);
    }

    let employee = await Employee.findById({ _id: request.employeeId });
    let vendor = await User.findById({ _id: req.user._id });

    await Services.NotificationService.sendNotification(employee._id, employee?.device_token, 'Reward Redeem Request Approved', `${vendor.name} has Approved your Reward Redeem Request.`);


    res.json({
      message: 'Request approved successfully',
      request
    });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to approve request',
      error: error.message
    });
  }
};
exports.rejectRequest = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const request = await RewardRedemption.findOneAndUpdate(
      {
        _id: req.params.requestId,
        employerId: req.user._id,
        status: 'pending'
      },
      {
        status: 'rejected',
        processedBy: req.user._id,
        processedAt: new Date(),
        rejectionReason
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ message: 'Pending request not found' });
    }

    res.json({
      message: 'Request rejected successfully',
      request
    });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to reject request',
      error: error.message
    });
  }
};