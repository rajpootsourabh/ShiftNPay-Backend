const Models = require("./../../../model/index");
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;



// Create new schedule
exports.createSchedule = async (req, res) => {
  try {
    const scheduleData = req.body;
    const vendorId = req.user._id;

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
}