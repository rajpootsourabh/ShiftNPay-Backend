const Job = require("../model/Job")

exports.gettingJobsByVendorId = async (id) => {
    try {
        return await Job.find({ userId: id })
    } catch (error) {
        return error
    }
}