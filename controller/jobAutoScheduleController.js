const { default: mongoose } = require("mongoose");
const Employee = require("../model/Employee");
const Job = require("../model/Job");
const JobAssignmentQueue = require("../model/JobAssignmentQueue");
const Services = require('./../services');

const NotificationService = require('../services/notificationService');
const User = require("../model/User");

// @desc    Get unassigned jobs
// @route   GET /api/jobs/unassigned
// @access  Vendor
exports.getUnassignedJobs = async (req, res) => {
  try {
    const { vendorId } = req.query;

    const employees = await Employee.find({ userId: vendorId });

    const assignedJobIds = employees.reduce((acc, employee) => {
      return acc.concat(employee.jobId || []);
    }, []);

    const jobs = await Job.find({
      userId: vendorId,
      _id: { $nin: assignedJobIds },
      status: { $ne: 'completed' }
    }).sort({ createdAt: -1 }).populate({
      path: 'shift',
      select: 'name utcStart utcEnd' // Include the shift fields you need
    });

    res.json(jobs);
  } catch (err) {
    console.error('Get unassigned jobs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Start auto-scheduling for a job
// @route   POST /api/jobs/:id/auto-schedule
// @access  Vendor
exports.startAutoSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    // Validate job exists and belongs to vendor
    const job = await Job.findOne({ _id: id, userId: vendorId });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if job is already assigned
    if (job.assignedTo) {
      return res.status(400).json({ error: 'Job already assigned' });
    }

    // Check if auto-scheduling already in progress
    const existingQueue = await JobAssignmentQueue.findOne({ jobId: id });
    if (existingQueue) {
      return res.status(400).json({ error: 'Auto-scheduling already in progress' });
    }

    // Get active employees sorted by priority/skills
    const employees = await Employee.find({
      userId: vendorId,
      empStatus: 'active'
    }).sort({ priority: 1, skillScore: -1 });

    if (!employees.length) {
      return res.status(400).json({ error: 'No active employees available' });
    }

    // Create job queue
    const queue = await JobAssignmentQueue.create({
      jobId: id,
      vendorId,
      employeeQueue: employees.map(emp => ({
        employeeId: emp._id,
        priority: emp.priority
      })),
      status: 'pending'
    });

    // Notify first employee
    // await NotificationService.notifyEmployee(
    //   queue.employeeQueue[0].employeeId, 
    //   'New job assignment',
    //   `You have a new job request: ${job.title}`,
    //   { jobId: id, queueId: queue._id }
    // );
    let employee = await Employee.findById({ _id: queue.employeeQueue[0].employeeId });
    let vendor = await User.findById({ _id: vendorId });

    await Services.NotificationService.sendNotification(employee._id, employee.device_token, 'New job assignment!', `${vendor.name} has sent You a new job request: ${job.title}`);
    res.json({
      message: 'Auto-scheduling started',
      queueId: queue._id,
      firstEmployee: queue.employeeQueue[0].employeeId
    });

  } catch (err) {
    console.error('Start auto-schedule error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get job queue status
// @route   GET /api/job-queues
// @access  Vendor/Employee
exports.getQueueStatus = async (req, res) => {
  try {
    const { vendorId, employeeId } = req.query;
    let query = {};

    if (vendorId) {
      query.vendorId = vendorId;
    } else if (employeeId) {
      query = {
        'employeeQueue.employeeId': employeeId,
        status: 'pending'
      };
    }

    const queues = await JobAssignmentQueue.find(query)
      .populate({
        path: 'jobId',
        select: 'name overtimeAllowed status statusByEmployee subJob shift',
        populate: {
          path: 'shift',
          select: 'name utcStart utcEnd' // Include the shift fields you need
        }
      })
      .populate('employeeQueue.employeeId', 'name email')
      .populate('responses.employeeId', 'name email')
      .sort({ createdAt: -1 });

    res.json(queues);
  } catch (err) {
    console.error('Get queue status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Respond to job request
// @route   POST /api/job-requests/:id/respond
// @access  Employee
exports.respondToJobRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const employeeId = req.user._id;
    // Validate request
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const queue = await JobAssignmentQueue.findById(id)
      .populate('jobId')
      .populate('employeeQueue.employeeId');

    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    // Validate employee is current in queue
    const currentEmployee = queue.employeeQueue[queue.currentEmployeeIndex]?.employeeId;
    if (String(currentEmployee._id) !== String(employeeId)) {
      return res.status(403).json({ error: 'Not your turn to respond' });
    }

    // Record response
    queue.responses.push({
      employeeId,
      status,
      respondedAt: new Date()
    });

    if (status === 'accepted') {
      // Assign job
      const checkEmpJob = await Employee.findOne({ _id: employeeId, jobId: { $elemMatch: { $eq: queue.jobId._id } } });
      if (checkEmpJob) {
        return res.status(400).json({ msg: `Job ${checkJob?.name} is already assigned!`, success: false })
      }
      await Employee.findByIdAndUpdate({ _id: employeeId }, { $push: { jobId: queue.jobId._id } })

      queue.status = 'accepted';
      await queue.save();

    let vendor = await User.findById({ _id:  queue.vendorId });
    await Services.NotificationService.sendNotification(vendor._id, vendor.device_token, 'Job Accepted!', `${currentEmployee.name} accepted job: ${queue.jobId.title}`);

      return res.json({
        message: 'Job accepted successfully',
        jobAssigned: true
      });
    }

    // Handle rejection - move to next employee
    queue.currentEmployeeIndex++;
    queue.requestTime = new Date();

    // Check if all employees exhausted
    if (queue.currentEmployeeIndex >= queue.employeeQueue.length) {
      if (queue.currentRetry < queue.maxRetries) {
        queue.currentEmployeeIndex = 0;
        queue.currentRetry++;
        queue.status = 'retrying';
      } else {
        queue.status = 'failed';
      }
    }

    await queue.save();

    if (queue.status === 'pending' || queue.status === 'retrying') {
      const nextEmployee = queue.employeeQueue[queue.currentEmployeeIndex].employeeId;
      // await NotificationService.notifyEmployee(
      //   nextEmployee._id,
      //   'New job assignment',
      //   `You have a new job request: ${queue.jobId.title}`,
      //   { jobId: queue.jobId._id, queueId: queue._id }
      // );
      let employee = await Employee.findById({ _id: queue.employeeQueue[0].employeeId });
      let vendor = await User.findById({ _id: queue.vendorId });

      await Services.NotificationService.sendNotification(employee._id, employee.device_token, 'New job assignment!', `${vendor.name} has sent You a new job request: ${job.title}`);

      
    }

    res.json({
      message: 'Response recorded',
      jobAssigned: false
    });

  } catch (err) {
    console.error('Respond to job request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Reset auto-scheduling for a job
// @route   POST /api/job-queues/:id/reset
// @access  Vendor
exports.resetJobQueue = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    const queue = await JobAssignmentQueue.findOneAndUpdate(
      { _id: id, vendorId },
      {
        currentEmployeeIndex: 0,
        currentRetry: 0,
        status: 'pending',
        requestTime: new Date()
      },
      { new: true }
    ).populate('employeeQueue.employeeId').populate('jobId');

    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    // Notify first employee
    await NotificationService.notifyEmployee(
      queue.employeeQueue[0].employeeId._id,
      'New job assignment',
      `You have a new job request: ${queue.jobId.title}`,
      { jobId: queue.jobId._id, queueId: queue._id }
    );

    res.json({
      message: 'Auto-scheduling reset',
      queue
    });

  } catch (err) {
    console.error('Reset job queue error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getJobRequest = async (req, res) => {
  try {
    const employeeId = req.user._id;

    // First find all pending requests for this employee
    const requests = await JobAssignmentQueue.find({
      status: 'pending',
      'employeeQueue.employeeId': employeeId
    })
    .populate({
      path: 'jobId',
      select: 'name overtimeAllowed status statusByEmployee subJob shift',
      populate: {
        path: 'shift',
        select: 'name utcStart utcEnd' // Include the shift fields you need
      }
    })
      .populate('vendorId', 'name')
      .populate('employeeQueue.employeeId', 'name email');

    // Then filter in JavaScript to find where employee is current
    const pendingRequest = requests.find(queue => {
      const index = queue.employeeQueue.findIndex(
        item => item.employeeId._id.equals(employeeId)
      );
      return queue.currentEmployeeIndex === index;
    });

    res.json(pendingRequest || null);
  } catch (err) {
    console.error('Error checking job requests:', err);
    res.status(500).json({ error: 'Server error' });
  }
};