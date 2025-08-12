const { startOfWeek, endOfWeek, subWeeks } = require('date-fns');
const RewardConfig = require('../model/RewardConfig');
const Tracking = require('../model/Tracking');
const WeeklyReward = require('../model/WeeklyReward');

class RewardService {
  // Calculate rewards for previous week
  static async calculateWeeklyRewards(employerId) {
    const config = await RewardConfig.findOne({ employerId });
    if (!config || !config.isActive) return [];
    
    const now = new Date();
    const currentWeekStart = startOfWeek(now, { weekStartsOn: config.weekStartDay });
    const prevWeekStart = subWeeks(currentWeekStart, 1);
    const prevWeekEnd = endOfWeek(prevWeekStart, { weekStartsOn: config.weekStartDay });

    // Get all employees with tracked hours
    const results = await Tracking.aggregate([
      {
        $match: {
          employerId: config.employerId,
          sessionDate: { $gte: prevWeekStart, $lte: prevWeekEnd }
        }
      },
      {
        $group: {
          _id: "$userId",
          totalHours: { $sum: { $divide: ["$elapsedTime", 3600000] } } // ms to hours
        }
      }
    ]);

    // Create reward records
    const rewards = [];
    for (const result of results) {
      const bonusHours = result.totalHours >= config.thresholdHours ? config.rewardHours : 0;
      
      const reward = await weekl.findOneAndUpdate(
        { 
          employerId,
          employeeId: result._id,
          weekStartDate: prevWeekStart 
        },
        {
          weekEndDate: prevWeekEnd,
          totalHours: result.totalHours,
          bonusHours,
          status: bonusHours > 0 ? 'approved' : 'pending'
        },
        { upsert: true, new: true }
      );
      
      rewards.push(reward);
    }

    return rewards;
  }

  // Mark reward as redeemed
  static async redeemReward(rewardId, employerId) {
    return await WeeklyReward.findOneAndUpdate(
      { 
        _id: rewardId,
        employerId,
        status: 'approved' 
      },
      { 
        status: 'redeemed',
        redeemedAt: new Date() 
      },
      { new: true }
    );
  }

  // Get employee's reward summary
  static async getEmployeeSummary(employeeId) {
    return await WeeklyReward.aggregate([
      { $match: { employeeId } },
      { 
        $group: {
          _id: null,
          totalBonusHours: { $sum: "$bonusHours" },
          availableHours: { 
            $sum: { 
              $cond: [{ $eq: ["$status", "approved"] }, "$bonusHours", 0] 
            } 
          }
        }
      }
    ]);
  }
}

module.exports = RewardService;