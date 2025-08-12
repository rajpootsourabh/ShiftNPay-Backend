const Admin = require("../model/Admin");
const User = require("../model/User");
const { createToken } = require("../util/createToken");
const bcrypt = require('bcrypt');
const { sendMail, sendMailToApprove } = require("../util/mailService");
const Employee = require("../model/Employee");
const Job = require("../model/Job");
const Plan = require("../model/Plan");
const Credential = require("../model/Credential");
require('dotenv').config()

const salt = process.env.SALT

exports.register = async (req, res) => {

    const email = req.body.email
    const password = req.body.password

    try {
        const hassPass = await bcrypt.hashSync(password, parseInt(salt))
        const result = await Admin.create({ email: email, password: hassPass })
        if (!result) {
            return res.status(400).json({ msg: 'Faild to register super admin!', success: false })
        }
        /* const token = createToken({ _id: result._id, email: result.email })
        if (!token) {
            return res.status(400).json({ msg: 'Failed to create token!', success: false })
        } */
        return res.status(200).json({ msg: 'Ok', success: true, result })

    } catch (error) {
        console.log("error on register: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.loginSuperAdmin = async (req, res) => {
    console.log("req.body: ", req.body);
    const email = req.body.email
    const password = req.body.password

    try {
        const checkSuperAdmin = await Admin.findOne({ email: email })
        if (!checkSuperAdmin) {
            return res.status(404).json({ msg: 'Admin not found!', success: false })
        }

        const matchPass = await bcrypt.compare(password, checkSuperAdmin.password)
        if (!matchPass) {
            return res.status(400).json({ msg: 'Email or Password are incorrect!', success: false })
        }
        const token = createToken({ _id: checkSuperAdmin._id, email: checkSuperAdmin.email })
        if (!token) {
            return res.status(400).json({ msg: 'Failed to create token!', success: false })
        }
        return res.status(200).json({ msg: 'Ok', success: true, result: checkSuperAdmin, token })
    } catch (error) {
        console.log("error on loginSuperAdmin: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.getAllVendor = async (req, res) => {

    try {
        const result = await User.find({ role: 'vender' }).select("-password")
        if (!result) {
            return res.status(404).json({ msg: 'No vendor found!', success: false })
        }
        return res.status(200).json({ msg: 'ok', success: true, result })
    } catch (error) {
        console.log("error on getAllVendor: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.approveVendor = async (req, res) => {
    const id = req.params.id
    const status = req.body.status

    try {
        const checkVendor = await User.findById(id)
        if (!checkVendor) {
            return res.status(404).json({ msg: 'No vendor data found!', success: false })
        }
        const result = await User.findOneAndUpdate({ _id: id }, { status: status })
        if (result) {
            sendMailToApprove(checkVendor.email, checkVendor.name, `Your account has been approved in shiftnpay.com`)
            return res.status(200).json({ msg: `Vendor ${checkVendor.name} approved successfully.`, success: true })
        }
        return res.status(400).json({ msg: `Failed to approve ${checkVendor.name}`, success: false })
    } catch (error) {
        console.log("error on approveVendor: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.getCount = async (req, res) => {
    const id = req.params.id
    // console.log("id: ", id);
    try {
        const checkUser = await Admin.findById(id)
        if (!checkUser) {
            return res.status(403).json({ msg: 'Forbidden Access!', success: false })
        }
        const vendorCount = await User.countDocuments({ role: 'vender' })
        const vendorActiveCount = await User.countDocuments({ role: 'vender', status: true })
        const vendorInActiveCount = await User.countDocuments({ role: 'vender', status: false })
        const empCount = await Employee.countDocuments()
        const jobCount = await Job.countDocuments()
        const planCount = await Plan.countDocuments()
        const apiCount = await Credential.countDocuments()

        return res.status(200).json({ msg: 'Ok', success: true, result: { vendorCount, empCount, jobCount, planCount, apiCount, vendorActiveCount, vendorInActiveCount } })
        // return res.status(200).json({ msg: 'ok', success: true })
    } catch (error) {
        console.log("error on getCount: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}