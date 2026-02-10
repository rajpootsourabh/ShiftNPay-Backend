const Models = require("./../../../model/index");
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// Helper function to check if a date range overlaps with any approved interruption
const checkClientInterruptions = async (clientId, startDate, endDate) => {
  const client = await Models.Client.findById(clientId);
  if (!client || !client.interruptions || !Array.isArray(client.interruptions)) {
    return { blocked: false };
  }

  const scheduleStart = new Date(startDate);
  const scheduleEnd = new Date(endDate);

  for (const interruption of client.interruptions) {
    // Only check approved interruptions
    if (interruption.status !== 'approved') continue;

    const intStart = new Date(interruption.startDate);
    const intEnd = new Date(interruption.endDate);

    // Check if schedule dates overlap with interruption dates
    if (scheduleStart <= intEnd && scheduleEnd >= intStart) {
      return {
        blocked: true,
        interruption: {
          startDate: interruption.startDate,
          endDate: interruption.endDate,
          type: interruption.type,
          reason: interruption.reason
        }
      };
    }
  }

  return { blocked: false };
};

// Create new schedule
exports.createSchedule = async (req, res) => {
  try {
    const scheduleData = req.body;
    const vendorId = req.user._id;

    // Check for client interruptions (service blocked periods)
    if (scheduleData.client) {
      const interruptionCheck = await checkClientInterruptions(
        scheduleData.client,
        scheduleData.start || scheduleData.startDate,
        scheduleData.end || scheduleData.endDate
      );

      if (interruptionCheck.blocked) {
        return res.status(403).json({
          message: `Scheduling blocked: Client has an approved service interruption from ${interruptionCheck.interruption.startDate} to ${interruptionCheck.interruption.endDate}`,
          reason: interruptionCheck.interruption.reason,
          type: interruptionCheck.interruption.type,
          interruptionPeriod: interruptionCheck.interruption
        });
      }
    }

    // Check for existing schedule with same client, service, caregiver, and overlapping time
    const existingSchedule = await Models.Schedule.findOne({
      client: scheduleData.client,
      service: scheduleData.service,
      caregiver: scheduleData.caregiver,
      $or: [
        {
          // New schedule starts during existing schedule
          start: { $lte: scheduleData.start },
          end: { $gt: scheduleData.start }
        },
        {
          // New schedule ends during existing schedule
          start: { $lt: scheduleData.end },
          end: { $gte: scheduleData.end }
        },
        {
          // New schedule completely contains existing schedule
          start: { $gte: scheduleData.start },
          end: { $lte: scheduleData.end }
        }
      ]
    });

    if (existingSchedule) {
      return res.status(409).json({
        message: "A schedule with the same client, service, and caregiver already exists for this time period",
        conflictingSchedule: existingSchedule
      });
    }

    if (!scheduleData.title) {
      scheduleData.title = `${scheduleData.service} - ${scheduleData.client}`;
    }

    const schedule = new Models.Schedule({
      ...scheduleData,
      createdBy: req.user._id,
      vendorId
    });

    await schedule.save();
    const id= schedule._id;
   const scheduleD = await Models.Schedule.findById(id)
      .populate('client', 'firstName lastName')
      .populate('caregiver', 'firstName lastName')
      .populate('payor', 'payorName')
      .populate({
        path: "service",
        populate: {
          path: "shift",   // <-- populate inside job
        },
      });
    
    res.status(201).json(scheduleD);
  } catch (error) {
    if (error.code === 11000) {
      // MongoDB duplicate key error
      return res.status(409).json({
        message: "A similar schedule already exists",
        error: error.message
      });
    }
    res.status(400).json({ message: error.message });
  }
};


exports.getAllSchedules = async (req, res) => {
  try {
    const { month, caregiver } = req.query;
    const vendorId = req.user._id;

    let query = { vendorId: new ObjectId(vendorId) };

    if (month) {
      const [year, monthNum] = month.split("-").map(Number);

     const startOfRange = new Date(Date.UTC(year, monthNum - 1, 0, 0, 0, 0, 0));

      // Next month last day end (23:59:59.999 UTC)
      const endOfRange = new Date(Date.UTC(year, monthNum + 1, 0, 23, 59, 59, 999));

      query.$and = [
        { start: { $lte: endOfRange } }, // started before next month starts
        { end: { $gte: startOfRange } }  // ended after last month ends
      ];
    }

    if (caregiver) {
      query.caregiver = new ObjectId(caregiver);
    }

    query.vendorId = new ObjectId(vendorId);

    const schedules = await Models.Schedule.find(query)
      .populate('client', 'firstName lastName')
      .populate('caregiver', 'firstName lastName')
      .populate('payor', 'payorName')
      .populate({
        path: "service",
        populate: { path: "shift" },
      })
      .sort({ start: 1 });

    res.json(schedules);
  } catch (error) {
    console.error('Error in getAllSchedules:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getSchedule = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const schedule = await Models.Schedule.findById(req.params.id)
      .populate('client')
      .populate('caregiver')
      .populate('payor')
      .populate({
        path: "service",
        populate: {
          path: "shift",   // <-- populate inside job
        },
      })
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const scheduleData = req.body;
    const scheduleId = req.params.id;

    // Check for client interruptions (service blocked periods)
    if (scheduleData.client) {
      const interruptionCheck = await checkClientInterruptions(
        scheduleData.client,
        scheduleData.start || scheduleData.startDate,
        scheduleData.end || scheduleData.endDate
      );

      if (interruptionCheck.blocked) {
        return res.status(403).json({
          message: `Scheduling blocked: Client has an approved service interruption from ${interruptionCheck.interruption.startDate} to ${interruptionCheck.interruption.endDate}`,
          reason: interruptionCheck.interruption.reason,
          type: interruptionCheck.interruption.type,
          interruptionPeriod: interruptionCheck.interruption
        });
      }
    }

    // Check for existing schedule with same client, service, caregiver, and overlapping time
    // Exclude the current schedule being updated
    const existingSchedule = await Models.Schedule.findOne({
      _id: { $ne: scheduleId }, // Exclude the current schedule
      client: scheduleData.client,
      service: scheduleData.service,
      caregiver: scheduleData.caregiver,
      $or: [
        {
          // New schedule starts during existing schedule
          start: { $lte: scheduleData.start },
          end: { $gt: scheduleData.start }
        },
        {
          // New schedule ends during existing schedule
          start: { $lt: scheduleData.end },
          end: { $gte: scheduleData.end }
        },
        {
          // New schedule completely contains existing schedule
          start: { $gte: scheduleData.start },
          end: { $lte: scheduleData.end }
        }
      ]
    });

    if (existingSchedule) {
      return res.status(409).json({
        message: "A schedule with the same client, service, and caregiver already exists for this time period",
        conflictingSchedule: existingSchedule
      });
    }

    const schedule = await Models.Schedule.findByIdAndUpdate(
      scheduleId,
      {
        ...scheduleData,
        updatedBy: req.user._id
      },
      { new: true, runValidators: true }
    ).populate('client caregiver payor');

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    res.json(schedule);
  } catch (error) {
    if (error.code === 11000) {
      // MongoDB duplicate key error
      return res.status(409).json({
        message: "A similar schedule already exists",
        error: error.message
      });
    }
    res.status(400).json({ message: error.message });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const schedule = await Models.Schedule.findByIdAndDelete(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateJobStatus = async (req, res) => {
  try {
    const { status, actualStartTime, actualEndTime, duration } = req.body;

    const updateData = { jobStatus: status };

    if (actualStartTime) updateData.actualStartTime = new Date(actualStartTime);
    if (actualEndTime) updateData.actualEndTime = new Date(actualEndTime);
    if (duration) updateData.duration = duration;

    const schedule = await Models.Schedule.findByIdAndUpdate(
      req.params.id,
      {
        ...updateData,
        updatedBy: req.user._id
      },
      { new: true }
    ).populate('client caregiver');

    res.json(schedule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get schedules by date range (for calendar view)
exports.getSchedulesByDateRange = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }

    const schedules = await Models.Schedule.find({
      start: { $gte: new Date(start) },
      end: { $lte: new Date(end) }
    })
      .populate('client', 'firstName lastName')
      .populate('caregiver', 'firstName lastName')
      .populate('payor', 'payorName')
      .populate('service', 'name')
      .sort({ start: 1 });

    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.fetchVendorJobs = async (req, res) => {
  const vendorId = req.user._id;
  try {
    const result = await Models.JobModel.find({ userId: vendorId })
    if (result) {
      res.json(result);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get client interruptions for calendar display (blocked periods)
exports.getClientInterruptions = async (req, res) => {
  try {
    const { clientId, start, end } = req.query;

    if (!clientId) {
      return res.status(400).json({ message: 'Client ID is required' });
    }

    const client = await Models.Client.findById(clientId).select('interruptions firstName lastName');

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Filter approved interruptions that overlap with the date range
    let interruptions = client.interruptions || [];
    
    // Filter by approved status only
    interruptions = interruptions.filter(int => int.status === 'approved');

    // If date range provided, filter by overlap
    if (start && end) {
      const rangeStart = new Date(start);
      const rangeEnd = new Date(end);
      
      interruptions = interruptions.filter(int => {
        const intStart = new Date(int.startDate);
        const intEnd = new Date(int.endDate);
        return intStart <= rangeEnd && intEnd >= rangeStart;
      });
    }

    res.json({
      clientId: client._id,
      clientName: `${client.firstName} ${client.lastName}`,
      interruptions: interruptions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check if scheduling is blocked for a client on specific dates
exports.checkSchedulingBlocked = async (req, res) => {
  try {
    const { clientId, start, end } = req.query;

    if (!clientId || !start || !end) {
      return res.status(400).json({ message: 'Client ID, start date, and end date are required' });
    }

    const result = await checkClientInterruptions(clientId, start, end);

    res.json({
      blocked: result.blocked,
      interruption: result.interruption
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}