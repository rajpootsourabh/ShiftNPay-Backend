

exports.jobValidation = async (req, res, next) => {
    const id = req.body.id
    const name = req.body.name
    try {
        if (!id) {
            return res.status(400).json({ msg: 'id is required!', success: false })
        } else if (!name) {
            return res.status(400).json({ msg: 'Name is required!', success: false })
        } else {
            next()
        }
    } catch (error) {
        //console.log("error on jobValidation: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.idValidationBody = async (req, res, next) => {
    // const idParam = req.params?.id
    const id = req.body?.id
    try {
        if (!id) {
            return res.status(400).json({ msg: 'Id is required!', success: false })
        }
        next()
    } catch (error) {
        //console.log("error on idValidation: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.isValidationParams = async (req, res, next) => {
    const id = req.params.id
    // //console.log("id: ", req.params);
    try {
        if (!id) {
            return res.status(400).json({ msg: 'Id is required!', success: false })
        }
        next()
    } catch (error) {
        //console.log("error on isValidationParams: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}