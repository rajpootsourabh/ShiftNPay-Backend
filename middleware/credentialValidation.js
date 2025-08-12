

exports.credentailValidation = async (req, res, next) => {
    // //console.log("req.body: ", req.body);
    const name = req.body.name
    const credential = req.body.credential

    try {
        if (!name) {
            return res.status(400).json({ msg: 'Credentail name is required!', success: false })
        } else if (!credential) {
            return res.status(400).json({ msg: 'Credentail is required!', success: false })
        } else {
            next()
        }
    } catch (error) {
        //console.log("error on credentailValidation: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}