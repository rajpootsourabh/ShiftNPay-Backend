const { default: mongoose } = require("mongoose");
const Tracking = require("../model/Tracking");
const moment = require("moment");

exports.calculateWeeklyHours = async (userId) => {
    const startOfWeek = moment().startOf('isoWeek').startOf('day').toDate();
    const endOfWeek = moment().endOf('isoWeek').endOf('day').toDate();
    console.log('startOfWeek : ' ,startOfWeek);
    console.log('endOfWeek : ' ,endOfWeek);
    const results = await Tracking.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                createdAt: { $gte: startOfWeek, $lte: endOfWeek }
            }
        },
        {
            $project: {
                duration: {
                    $cond: {
                        if: { $ifNull: ["$elapsedTime", false] },  
                        then: "$elapsedTime",
                        else: "$count"
                    }
                }
            }
        },
        {
            $group: {
                _id: null,
                totalSeconds: { $sum: "$duration" }
            }
        },
        {
            $project: {
                _id: 0,
                totalSeconds: 1  
            }
        }
    ]);

    return results;
};
