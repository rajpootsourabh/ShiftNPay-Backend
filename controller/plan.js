const Plan = require("../model/Plan")


exports.getAllPlans = async (req, res) => {
    try {
        const result = await Plan.find()
        if (!result) {
            return res.status(404).json({ msg: 'No plan found!', success: false })
        }
        return res.status(200).json({ msg: 'Ok', result, success: true })
    } catch (error) {
        console.log("error on getAllPlans: ", error);
        return res.status(500).json({ msg: error.error, error, success: false })
    }
}

exports.getSinglePlans = async (req, res) => {
    const id = req.params.id
    try {
        const result = await Plan.findById(id)
        if (!result) {
            return res.status(404).json({ msg: 'No plan found!', success: false })
        }
        return res.status(200).json({ msg: 'Ok', success: true, result })
    } catch (error) {
        console.log("error on getSinglePlans: ", error);
        return res.status(500).json({ msg: error.error, error, success: false })
    }
}


exports.addAndUpdateOfPlan = async (req, res) => {
    const title = req.body.title
    const price = req.body.price
    const type = req.body.type
    const duration = req.body.duration
    const durationType = req.body.durationType

    const id = req.params?.id

    try {
        // here using mongoose $or operator it finds title or id both of one if match thant goose to udpate it with the follwing data and 
        // keyword new: true: This option specifies that the updated document should be returned rather than the original document. So, if a document is updated, the updated version will be returned.
        // upsert: true: This option specifies that if no documents match the query criteria, a new document should be created using the update values provided. In other words, if no matching document is found, it performs an "upsert" operation (update or insert).
        const plan = await Plan.findOneAndUpdate(
            { $or: [{ title: title }, { _id: id }] },
            { title: title, price: price, type: type, duration: duration, durationType },
            { new: true, upsert: true }
        );
        if (plan) {
            return res.status(200).json({ msg: `Plan ${id ? title + ' updated' : title + ' added'} successfully.`, success: true, result: plan })
        }
        return res.status(400).json({ msg: `Failed to add plan!`, success: false })
    } catch (error) {
        console.log("error on addAndUpdateOfPlan: ", error);
        return res.status(500).json({ msg: error.error, error, success: false })
    }
}

exports.deletePlanById = async (req, res) => {
    const id = req.params.id
    try {
        if (!id) {
            return res.status(403).json({ msg: 'Forbidden Access!', success: false })
        }
        const result = await Plan.findByIdAndDelete(id)
        if (!result) {
            return res.status(404).json({ msg: 'No plan found!', success: false })
        }
        return res.status(200).json({ msg: `Plan deleted successfully.`, success: true })
    } catch (error) {
        console.log("error on deletePlanById: ", error);
        return res.status(500).json({ msg: error.error, error, success: false })
    }
}