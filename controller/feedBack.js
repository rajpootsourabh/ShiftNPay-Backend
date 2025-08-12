const Employee = require("../model/Employee")
const FeedBack = require("../model/FeedBack")
const User = require("../model/User")


exports.getByEmpId = async (req, res) => {
    const id = req.params.id
    try {
        const checkEmp = await Employee.findById(id)
        if (!checkEmp) {
            return res.status(403).json({ msg: 'No Employee data found!', success: false })
        }
        const result = await FeedBack.findOne({ empId: id }).populate("userId")
        if (result) {
            return res.status(200).json({ msg: 'Ok', success: true, result })
        }
        return res.status(400).json({ msg: 'No review data found!', success: false })
    } catch (error) {
        //console.log("error on getByEmpId: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.addFeedBack = async (req, res) => {
    // //console.log("req.body: ", req.body);
    const id = req.body.id
    const userId = req.body.userId
    const feed = req.body.feed
    const rate = req.body.rate

    try {
        const checkEmp = await Employee.findById(id)
        if (!checkEmp) {
            return res.status(404).json({ msg: 'No employee data found!', success: false })
        }

        const checkVendor = await User.findById(userId)
        if (!checkVendor) {
            return res.status(400).json({ msg: 'No vedor details found!', success: false })
        }

        const result = await FeedBack.create({ empId: id, userId: userId, feed: feed, rate: rate })
        if (result) {
            return res.status(200).json({ msg: 'Review added successfully.', success: true })
        }
        return res.status(400).json({ msg: 'Failed to add review!', success: false })
    } catch (error) {
        //console.log("error on addFeedBack: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.updateFeedBack = async (req, res) => {
    // //console.log("req.body: ", req.body);
    const id = req.body.id
    const feed = req.body.feed
    const rate = req.body.rate

    try {
        const checkFeedBack = await FeedBack.findById(id)
        if (!checkFeedBack) {
            return res.status(404).json({ msg: 'No review data found!', success: false })
        }
        const result = await FeedBack.findByIdAndUpdate({ _id: id }, { feed: feed, rate: rate })
        if (result) {
            return res.status(200).json({ msg: 'Review updated successfully.', success: true })
        }
        return res.status(400).json({ msg: 'Failed to update review!', success: false })
    } catch (error) {
        //console.log("error on updateFeedBack: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}