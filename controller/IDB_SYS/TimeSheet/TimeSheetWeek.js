const Models = require("./../../../model/index");

const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
// Create Timesheet Weeks
exports.createWeeksRange = async (req, res) => {
  try {
    const { endDate, numberOfWeeks, payrollDays } = req.body;
    const startDate = endDate;
    // Validation
    if (!startDate || !numberOfWeeks || !payrollDays) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (isNaN(numberOfWeeks) || numberOfWeeks < 1 || numberOfWeeks > 52) {
      return res
        .status(400)
        .json({ message: "Number of weeks must be between 1 and 52" });
    }

    const parsedPayrollDays = parseInt(payrollDays);
    if (![5, 6, 7].includes(parsedPayrollDays)) {
      return res
        .status(400)
        .json({ message: "Payroll days must be 5, 6, or 7" });
    }

    // Parse the start date
    const startDateObj = new Date(startDate);
    if (isNaN(startDateObj.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // Set to start of day (00:00:00)
    startDateObj.setHours(0, 0, 0, 0);

    const createdWeeks = [];
    let currentStartDate = new Date(startDateObj);

    for (let i = 0; i < parseInt(numberOfWeeks); i++) {
      // Calculate end date (start date + payroll days - 1 day)
      const weekEndDate = new Date(currentStartDate);
      weekEndDate.setDate(currentStartDate.getDate() + parsedPayrollDays - 1);
      weekEndDate.setHours(23, 59, 59, 999);

      // Check for existing week with the same date range and vendor
      const existingWeek = await Models.TimesheetWeek.findOne({
        vendorId: req.user._id,
        startDate: currentStartDate,
        endDate: weekEndDate,
      });

      if (!existingWeek) {
        const newWeek = await Models.TimesheetWeek.create({
          vendorId: req.user._id,
          startDate: new Date(currentStartDate),
          endDate: weekEndDate,
          payrollDays: parsedPayrollDays,
          isLocked: false,
        });
        createdWeeks.push(newWeek);
      }

      // Move to the next week (current end date + 1 day)
      currentStartDate = new Date(weekEndDate);
      currentStartDate.setDate(currentStartDate.getDate() + 1);
      currentStartDate.setHours(0, 0, 0, 0);
    }

    if (createdWeeks.length === 0) {
      return res.status(200).json({
        message: "All weeks already exist for the specified date range",
        data: [],
      });
    }

    res.status(201).json({
      message: `${createdWeeks.length} timesheet weeks created successfully`,
      data: createdWeeks,
    });
  } catch (err) {
    console.error("Error creating weeks range:", err);
    res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Something went wrong",
    });
  }
};

// 2. Get all weeks
exports.getAllWeeks = async (req, res) => {
  try {
    const weeks = await Models.TimesheetWeek.find({
      vendorId: req.user._id,
    }).sort({ startDate: 1 });
    res.status(200).json(weeks);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching weeks", error: err.message });
  }
};

// 3. Get week by ID
exports.getWeekById = async (req, res) => {
  try {
    const week = await Models.TimesheetWeek.findById(req.params.id);
    if (!week) return res.status(404).json({ message: "Week not found" });
    res.status(200).json(week);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching week", error: err.message });
  }
};

// 4. Update week (only if unlocked)
exports.updateWeek = async (req, res) => {
  try {
    const { id } = req.params;
    const week = await Models.TimesheetWeek.findById(id);

    if (!week) return res.status(404).json({ message: "Week not found" });
    if (week.locked)
      return res.status(400).json({ message: "Cannot update a locked week" });

    const updatedWeek = await Models.TimesheetWeek.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedWeek);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating week", error: err.message });
  }
};

// 5. Lock week
exports.lockWeek = async (req, res) => {
  try {
    const { id } = req.params;
    const week = await Models.TimesheetWeek.findByIdAndUpdate(
      id,
      { locked: true },
      { new: true }
    );
    if (!week) return res.status(404).json({ message: "Week not found" });
    res.status(200).json({ message: "Week locked", data: week });
  } catch (err) {
    res.status(500).json({ message: "Error locking week", error: err.message });
  }
};

// 6. Unlock week
exports.unlockWeek = async (req, res) => {
  try {
    const { id } = req.params;
    const week = await Models.TimesheetWeek.findByIdAndUpdate(
      id,
      { locked: false },
      { new: true }
    );
    if (!week) return res.status(404).json({ message: "Week not found" });
    res.status(200).json({ message: "Week unlocked", data: week });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error unlocking week", error: err.message });
  }
};

// 7. Delete week (only if unlocked)
exports.deleteWeek = async (req, res) => {
  try {
    const { id } = req.params;
    const week = await Models.TimesheetWeek.findById(id);

    if (!week) return res.status(404).json({ message: "Week not found" });
    if (week.locked)
      return res.status(400).json({ message: "Cannot delete a locked week" });

    await Models.TimesheetWeek.findByIdAndDelete(id);
    res.status(200).json({ message: "Week deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting week", error: err.message });
  }
};

exports.fetchWeeklySchedules = async (req, res) => {
  try {
    const { weekId } = req.body;
    const vendorId = req.user._id;

    // Validate required parameters
    if (!weekId) {
      return res.status(400).json({
        message: "weekId is required parameter",
      });
    }

    // Find the timesheet week to get the date range
    const timesheetWeek = await Models.TimesheetWeek.findOne({
      _id: new ObjectId(weekId),
      vendorId: new ObjectId(vendorId),
    });

    if (!timesheetWeek) {
      return res.status(404).json({
        message: "Timesheet week not found",
      });
    }

    // Get the date range from the timesheet week
    const startOfWeek = new Date(timesheetWeek.startDate);
    const endOfWeek = new Date(timesheetWeek.endDate);

    // Set time boundaries for proper range comparison
    startOfWeek.setHours(0, 0, 0, 0);
    endOfWeek.setHours(23, 59, 59, 999);

    console.log("Fetching schedules for week:", {
      weekId,
      startOfWeek: startOfWeek.toISOString(),
      endOfWeek: endOfWeek.toISOString(),
    });

    // Build query to find schedules that overlap with the week
    let query = {
      vendorId: new ObjectId(vendorId),
      $or: [
        // Schedules that start AND end within the week
        {
          start: { $gte: startOfWeek },
          end: { $lte: endOfWeek },
        },
        // Schedules that start before the week but end during the week
        {
          start: { $lt: startOfWeek },
          end: { $gte: startOfWeek, $lte: endOfWeek },
        },
        // Schedules that start during the week but end after the week
        {
          start: { $gte: startOfWeek, $lte: endOfWeek },
          end: { $gt: endOfWeek },
        },
        // Schedules that span the entire week (start before and end after)
        {
          start: { $lt: startOfWeek },
          end: { $gt: endOfWeek },
        },
      ],
    };

    // Fetch schedules with populated data
    const schedules = await Models.Schedule.find(query)
      .populate("client", "firstName lastName")
      .populate("caregiver", "firstName lastName email phone")
      .populate({
        path: "payor",
        select: "payor payorId address1 city state status",
      })
      .populate("service", "name code")
      .sort({ start: 1 });

    console.log("Found schedules:", schedules.length);

    // Extract service IDs (job IDs) for tracking lookup
    const serviceIds = schedules.map((schedule) => schedule.service._id);

    // **FIX: Fetch tracking data ONLY for the specific week date range**
    const trackingData = await Models.Tracking.aggregate([
      {
        $match: {
          jobId: { $in: serviceIds },
          // **ADD THIS CONDITION to filter tracking by date range**
          $or: [
            // Tracking entries that started AND ended within the week
            {
              startTime: { $gte: startOfWeek },
              stoppedTime: { $lte: endOfWeek },
            },
            // Tracking entries that started before but ended during the week
            {
              startTime: { $lt: startOfWeek },
              stoppedTime: { $gte: startOfWeek, $lte: endOfWeek },
            },
            // Tracking entries that started during but ended after the week
            {
              startTime: { $gte: startOfWeek, $lte: endOfWeek },
              stoppedTime: { $gt: endOfWeek },
            },
            // Tracking entries that span the entire week
            {
              startTime: { $lt: startOfWeek },
              stoppedTime: { $gt: endOfWeek },
            },
            // Also include entries based on sessionDate if that's what you use
            {
              sessionDate: {
                $gte: startOfWeek,
                $lte: endOfWeek,
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: "$jobId",
          trackingEntries: {
            $push: {
              _id: "$_id",
              userId: "$userId",
              startTime: "$startTime",
              endTime: "$endTime",
              lastStartTime: "$lastStartTime",
              isTimerRunning: "$isTimerRunning",
              elapsedTime: "$elapsedTime",
              totalBreakTime: "$totalBreakTime",
              stoppedTime: "$stoppedTime",
              count: "$count",
              amount: "$amount",
              overAmount: "$overAmount",
              sessionDate: "$sessionDate",
              createdAt: "$createdAt",
              status: "$status",
              jobId: "$jobId",
              isOnBreak: "$isOnBreak",
              clockLogs: "$clockLogs",
            },
          },
          totalTrackedSeconds: { $sum: "$elapsedTime" },
          totalAmount: { $sum: "$amount" },
          totalOverAmount: { $sum: "$overAmount" },
        },
      },
    ]);

    // Create a map for easy lookup of tracking data by service ID
    const trackingMap = {};
    trackingData.forEach((item) => {
      trackingMap[item._id.toString()] = {
        trackingEntries: item.trackingEntries,
        totalTrackedSeconds: item.totalTrackedSeconds,
        totalTrackedHours: item.totalTrackedSeconds / 3600,
        totalAmount: item.totalAmount,
        totalOverAmount: item.totalOverAmount,
      };
    });

    // Filter out schedules that don't have any tracking entries
    const schedulesWithTracking = schedules.filter((schedule) => {
      const serviceIdStr = schedule.service._id.toString();
      return (
        trackingMap[serviceIdStr] &&
        trackingMap[serviceIdStr].trackingEntries.length > 0
      );
    });

    console.log("Schedules with tracking data:", schedulesWithTracking.length);

    // Format the response
    const formattedSchedules = schedulesWithTracking.map((schedule) => {
      const serviceIdStr = schedule.service._id.toString();
      const trackingInfo = trackingMap[serviceIdStr] || {
        trackingEntries: [],
        totalTrackedSeconds: 0,
        totalTrackedHours: 0,
        totalAmount: 0,
        totalOverAmount: 0,
      };

      const calculatedDuration = Math.round(
        (schedule.end - schedule.start) / (1000 * 60 * 60)
      );
      const calculatedTotalAmount = schedule.rate * calculatedDuration;

      return {
        _id: schedule._id,
        client: schedule.client
          ? {
              _id: schedule.client._id,
              name: `${schedule.client.firstName} ${schedule.client.lastName}`,
            }
          : null,
        caregiver: schedule.caregiver
          ? {
              _id: schedule.caregiver._id,
              name: `${schedule.caregiver.firstName} ${schedule.caregiver.lastName}`,
              email: schedule.caregiver.email,
              phone: schedule.caregiver.phone,
            }
          : null,
        payor: schedule.payor
          ? {
              _id: schedule.payor._id,
              name: schedule.payor.payorName,
            }
          : null,
        service: schedule.service
          ? {
              _id: schedule.service._id,
              name: schedule.service.name,
              code: schedule.service.code,
            }
          : null,
        serviceOrder: schedule.serviceOrder,
        payrollItem: schedule.payrollItem,
        rate: schedule.rate,
        start: schedule.start,
        end: schedule.end,
        allDay: schedule.allDay,
        jobStatus: schedule.jobStatus,
        confirmation: schedule.confirmation,
        duration: calculatedDuration,
        totalAmount: calculatedTotalAmount,
        // Tracking information
        tracking: {
          entries: trackingInfo.trackingEntries,
          summary: {
            totalTrackedSeconds: trackingInfo.totalTrackedSeconds,
            totalTrackedHours: trackingInfo.totalTrackedHours,
            totalTrackedAmount: trackingInfo.totalAmount,
            totalOverAmount: trackingInfo.totalOverAmount,
            varianceHours: calculatedDuration - trackingInfo.totalTrackedHours,
            varianceAmount: calculatedTotalAmount - trackingInfo.totalAmount,
          },
        },
      };
    });

    // Calculate overall totals including tracking data
    const totalTrackedHours = formattedSchedules.reduce(
      (sum, s) => sum + s.tracking.summary.totalTrackedHours,
      0
    );
    const totalTrackedAmount = formattedSchedules.reduce(
      (sum, s) => sum + s.tracking.summary.totalTrackedAmount,
      0
    );
    const totalTrackedOverAmount = formattedSchedules.reduce(
      (sum, s) => sum + s.tracking.summary.totalOverAmount,
      0
    );

    res.json({
      success: true,
      weekInfo: {
        _id: timesheetWeek._id,
        startDate: timesheetWeek.startDate,
        endDate: timesheetWeek.endDate,
        payrollDays: timesheetWeek.payrollDays,
        isLocked: timesheetWeek.isLocked,
      },
      schedules: formattedSchedules,
      totalSchedules: formattedSchedules.length,
      totalHours: formattedSchedules.reduce((sum, s) => sum + s.duration, 0),
      totalAmount: formattedSchedules.reduce(
        (sum, s) => sum + s.totalAmount,
        0
      ),
      totalTrackedHours,
      totalTrackedAmount,
      totalTrackedOverAmount,
    });
  } catch (error) {
    console.error("Error in fetchWeeklySchedules:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Old Code Below
// exports.fetchWeeklySchedules = async (req, res) => {
//   try {
//     const { weekId } = req.body;
//     const vendorId = req.user._id;

//     // Validate required parameters
//     if (!weekId) {
//       return res.status(400).json({
//         message: "weekId is required parameter"
//       });
//     }

//     // Find the timesheet week to get the date range
//     const timesheetWeek = await Models.TimesheetWeek.findOne({
//       _id: new ObjectId(weekId),
//       vendorId: new ObjectId(vendorId)
//     });

//     if (!timesheetWeek) {
//       return res.status(404).json({
//         message: "Timesheet week not found"
//       });
//     }

//     // Get the date range from the timesheet week
//     const startOfWeek = new Date(timesheetWeek.startDate);
//     const endOfWeek = new Date(timesheetWeek.endDate);

//     // Set time boundaries for proper range comparison
//     startOfWeek.setHours(0, 0, 0, 0);
//     endOfWeek.setHours(23, 59, 59, 999);

//     console.log('Fetching schedules for week:', {
//       weekId,
//       startOfWeek: startOfWeek.toISOString(),
//       endOfWeek: endOfWeek.toISOString()
//     });

//     // Build query to find schedules that overlap with the week
//     let query = {
//       vendorId: new ObjectId(vendorId),
//       $or: [
//         // Schedules that start AND end within the week
//         {
//           start: { $gte: startOfWeek },
//           end: { $lte: endOfWeek }
//         },
//         // Schedules that start before the week but end during the week
//         {
//           start: { $lt: startOfWeek },
//           end: { $gte: startOfWeek, $lte: endOfWeek }
//         },
//         // Schedules that start during the week but end after the week
//         {
//           start: { $gte: startOfWeek, $lte: endOfWeek },
//           end: { $gt: endOfWeek }
//         },
//         // Schedules that span the entire week (start before and end after)
//         {
//           start: { $lt: startOfWeek },
//           end: { $gt: endOfWeek }
//         }
//       ]
//     };

//     // Fetch schedules with populated data
//     const schedules = await Models.Schedule.find(query)
//       .populate('client', 'firstName lastName')
//       .populate('caregiver', 'firstName lastName email phone')
//       .populate({
//         path: 'payor',
//         select: 'payor payorId address1 city state status' // Specify fields from Payor model
//       })
//       .populate('service', 'name code')
//       .sort({ start: 1 });

//     console.log('Found schedules:', schedules);
//     console.log('Found schedules:', schedules.length);

//     // Extract service IDs (job IDs) for tracking lookup
//     const serviceIds = schedules.map(schedule => schedule.service._id);

//     // Fetch tracking data for all services in this week range
//     // Using jobId to match with schedule.service._id
//     const trackingData = await Models.Tracking.aggregate([
//       {
//         $match: {
//           jobId: { $in: serviceIds },
//         }
//       },
//       {
//         $group: {
//           _id: "$jobId",
//           trackingEntries: {
//             $push: {
//               _id: "$_id",
//               userId: "$userId",
//               startTime: "$startTime",
//               endTime: "$endTime",
//               lastStartTime: "$lastStartTime",
//               isTimerRunning: "$isTimerRunning",
//               elapsedTime: "$elapsedTime",
//               totalBreakTime: "$totalBreakTime",
//               stoppedTime: "$stoppedTime",
//               count: "$count",
//               amount: "$amount",
//               overAmount: "$overAmount",
//               sessionDate: "$sessionDate",
//               createdAt: "$createdAt",
//               status: "$status",
//               jobId: "$jobId",

//               isOnBreak: "$isOnBreak",
//               clockLogs: "$clockLogs"
//             }
//           },
//           totalTrackedSeconds: { $sum: "$elapsedTime" },
//           totalAmount: { $sum: "$amount" },
//           totalOverAmount: { $sum: "$overAmount" }
//         }
//       }
//     ]);

//     // Create a map for easy lookup of tracking data by service ID
//     const trackingMap = {};
//     trackingData.forEach(item => {
//       trackingMap[item._id.toString()] = {
//         trackingEntries: item.trackingEntries,
//         totalTrackedSeconds: item.totalTrackedSeconds,
//         totalTrackedHours: item.totalTrackedSeconds / 3600, // Convert seconds to hours
//         totalAmount: item.totalAmount,
//         totalOverAmount: item.totalOverAmount
//       };
//     });

//     // Filter out schedules that don't have any tracking entries
//     const schedulesWithTracking = schedules.filter(schedule => {
//       const serviceIdStr = schedule.service._id.toString();
//       return trackingMap[serviceIdStr] && trackingMap[serviceIdStr].trackingEntries.length > 0;
//     });

//     console.log('Schedules with tracking data:', schedulesWithTracking.length);

//     // Format the response with additional useful information including tracking data
//     const formattedSchedules = schedulesWithTracking.map(schedule => {
//       const serviceIdStr = schedule.service._id.toString();
//       const trackingInfo = trackingMap[serviceIdStr];

//       const calculatedDuration = Math.round((schedule.end - schedule.start) / (1000 * 60 * 60));
//       const calculatedTotalAmount = schedule.rate * calculatedDuration;

//       return {
//         _id: schedule._id,
//         client: schedule.client ? {
//           _id: schedule.client._id,
//           name: `${schedule.client.firstName} ${schedule.client.lastName}`
//         } : null,
//         caregiver: schedule.caregiver ? {
//           _id: schedule.caregiver._id,
//           name: `${schedule.caregiver.firstName} ${schedule.caregiver.lastName}`,
//           email: schedule.caregiver.email,
//           phone: schedule.caregiver.phone
//         } : null,
//         payor: schedule.payor ? {
//           _id: schedule.payor._id,
//           name: schedule.payor.payorName
//         } : null,
//         service: schedule.service ? {
//           _id: schedule.service._id,
//           name: schedule.service.name,
//           code: schedule.service.code
//         } : null,
//         serviceOrder: schedule.serviceOrder,
//         payrollItem: schedule.payrollItem,
//         rate: schedule.rate,
//         start: schedule.start,
//         end: schedule.end,
//         allDay: schedule.allDay,
//         jobStatus: schedule.jobStatus,
//         confirmation: schedule.confirmation,
//         duration: calculatedDuration,
//         totalAmount: calculatedTotalAmount,
//         // Tracking information
//         tracking: {
//           entries: trackingInfo.trackingEntries,
//           summary: {
//             totalTrackedSeconds: trackingInfo.totalTrackedSeconds,
//             totalTrackedHours: trackingInfo.totalTrackedHours,
//             totalTrackedAmount: trackingInfo.totalAmount,
//             totalOverAmount: trackingInfo.totalOverAmount,
//             varianceHours: calculatedDuration - trackingInfo.totalTrackedHours,
//             varianceAmount: calculatedTotalAmount - trackingInfo.totalAmount
//           }
//         }
//       };
//     });

//     // Calculate overall totals including tracking data
//     const totalTrackedHours = formattedSchedules.reduce((sum, s) => sum + s.tracking.summary.totalTrackedHours, 0);
//     const totalTrackedAmount = formattedSchedules.reduce((sum, s) => sum + s.tracking.summary.totalTrackedAmount, 0);
//     const totalTrackedOverAmount = formattedSchedules.reduce((sum, s) => sum + s.tracking.summary.totalOverAmount, 0);

//     res.json({
//       success: true,
//       weekInfo: {
//         _id: timesheetWeek._id,
//         startDate: timesheetWeek.startDate,
//         endDate: timesheetWeek.endDate,
//         payrollDays: timesheetWeek.payrollDays,
//         isLocked: timesheetWeek.isLocked
//       },
//       schedules: formattedSchedules,
//       totalSchedules: formattedSchedules.length,
//       totalHours: formattedSchedules.reduce((sum, s) => sum + s.duration, 0),
//       totalAmount: formattedSchedules.reduce((sum, s) => sum + s.totalAmount, 0),
//       // Tracking totals
//       totalTrackedHours,
//       totalTrackedAmount,
//       totalTrackedOverAmount
//     });

//   } catch (error) {
//     console.error('Error in fetchWeeklySchedules:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };
