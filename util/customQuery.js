const Employee = require("../model/Employee")
const Job = require("../model/Job")
const User = require("../model/User")


exports.checkUser = async (id) => {
    const result = await User.findById(id)
    if (result) {
        return result
    }
    return false
}

exports.checkEmp = async (id) => {
    const result = await Employee.findById(id)
    if (result) {
        return result
    }
    return false
}

exports.checkJob = async (id) => {
    const result = await Job.findById(id)
    if (result) {
        return result
    }
    return false
}