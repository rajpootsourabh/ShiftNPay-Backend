const Profile = require('../../../model/Profile');
const { getNextSequenceValue } = require('../../../model/Sequence');
const { sendMailAddedToVender } = require('../../../util/mailService');
const Models = require('./../../../model/index');
const bcrypt = require('bcrypt');
const salt = process.env.SALT;
// GET all CareGivers by Vendor with pagination and optional search
exports.getCareGiverByVendor = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const query = {
      userId : vendorId,
      ...(search && {
        $or: [
          { phone: { $regex: search, $options: "i" } },
        ],
      }),
    };

    const data = await Models.EmployeeModel.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Models.EmployeeModel.countDocuments(query);

    res.json({
      data,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET CareGiver by ID
exports.getCareGiverById = async (req, res) => {
  try {
    const data = await Models.EmployeeModel.findById(req.params.id);
    if (!data) return res.status(404).json({ message: 'CareGiver not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE a new CareGiver
exports.createCareGiver = async (req, res) => {
  const vendorId = req.user._id;
    try {
       
      const {email} = req.body;
        const checkProfile = await Profile.findOne({ userId: vendorId })

        const checkAlreadyEmp = await Models.EmployeeModel.findOne({ email: email });
        if (checkAlreadyEmp) {
            return res.status(400).json({ msg: `Employee ${email} already exists!`, success: false })
        }


        const username = email.split('@')[0];
        let password = username + 123
        const hasPass = await bcrypt.hashSync(password, parseInt(salt))
        const empId = await getNextSequenceValue('empId');

        const result = await Models.EmployeeModel.create({ userId: vendorId, email: email, password: hasPass, empId })
        if (!result) {
            return res.status(400).json({ msg: 'Failed to create employee!', success: false })
        }
            sendMailAddedToVender(email, null, `Welcome to ShiftNPay - Manage Your Time Cards Easily!`, checkProfile ? checkProfile?.restaurantsName : req.user?.email, email, password)
        return res.status(200).json(result)
    } catch (error) {
        //console.log("error on createEmployeee: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
};

// UPDATE CareGiver
exports.updateCareGiver = async (req, res) => {
  try {
    const data = await Models.EmployeeModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!data) return res.status(404).json({ message: 'CareGiver not found' });
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE CareGiver
exports.deleteCareGiver = async (req, res) => {
  try {
    const data = await Models.EmployeeModel.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ message: 'CareGiver not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
