const State = require("../model/State");
const User = require("../model/User");

exports.getStateByVendorId = async (req, res) => {
    const venderId = req.params.id
    try {
        const checkVendorId = await User.findById(venderId)
        if (!checkVendorId) {
            return res.status(403).json({ msg: 'Unauthorized Access!', success: false })
        }
        const result = await State.find({ userId: venderId }).sort({ name: 1 })
        if (result) {
            return res.status(200).json({ msg: 'Ok', success: true, result })
        }
        return res.status(404).json({ msg: 'No states found!', success: false })
    } catch (error) {
        //console.log("error on getStateByVendorIds: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.getSingleStateById = async (req, res) => {
    const id = req.params.id;
    try {
        const result = await State.findById(id)
        if (result) {
            return res.status(200).json({ msg: 'Ok', success: true, result })
        }
        return res.status(404).json({ msg: 'State not found!', success: false })
    } catch (error) {
        //console.log("error on getSingleStateById: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.addState = async (req, res) => {
    // //console.log("req.body: ", req.body);

    const userId = req.body.userId
    const name = req.body.name;
    const weekHours = req.body.weekHours;
    const dayHours = req.body.dayHours;

    try {
        const checkUser = await User.findById(userId);
        if (!checkUser) {
            return res.status(403).json({ msg: 'Unauthorized Access!', success: false })
        }
        const checkState = await State.findOne({ userId: userId, name: name });
        if (checkState) {
            return res.status(400).json({ msg: 'State already exists!', success: false })
        }

        const result = await State.create({ name, weekHours, dayHours, userId: userId });
        if (result) {
            return res.status(200).json({ msg: 'State added successfully!', success: true, data: result })
        }
        return res.status(400).json({ msg: 'Failed to add state!', success: false })
    } catch (error) {
        //console.log("error on addState: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.updateState = async (req, res) => {
    const id = req.body.id
    const name = req.body.name;
    const weekHours = req.body.weekHours;
    const dayHours = req.body.dayHours;

    try {
        const checkState = await State.findById(id);
        if (!checkState) {
            return res.status(404).json({ msg: 'State not found!', success: false })
        }
        const result = await State.findByIdAndUpdate({ _id: id }, { name: name, weekHours: weekHours, dayHours: dayHours })
        if (result) {
            return res.status(200).json({ msg: 'State updated successfully!', success: true, data: result })
        }
        return res.status(400).json({ msg: 'Failed to update state!', success: false })
    } catch (error) {
        //console.log("error on updateState: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.deleteState = async (req, res) => {
    const id = req.params.id
    try {
        const checkState = await State.findById(id);
        if (!checkState) {
            return res.status(404).json({ msg: 'State not found!', success: false })
        }
        const result = await State.findByIdAndDelete({ _id: id })
        if (result) {
            return res.status(200).json({ msg: 'State deleted successfully!', success: true, data: result })
        }
        return res.status(400).json({ msg: 'Failed to delete state!', success: false })
    } catch (error) {
        //console.log("error on deleteState: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}