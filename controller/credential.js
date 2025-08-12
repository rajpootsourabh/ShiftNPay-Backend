const Credential = require("../model/Credential");
const bcrypt = require('bcrypt')
require('dotenv').config()
const CryptoJS = require("crypto-js");


const salt = process.env.SALT
const secret = process.env.SECRET


exports.getAllCredentials = async (req, res) => {
    try {
        const result = await Credential.find().sort({ createdAt: -1 })
        if (result) {
            return res.status(200).json({ msg: 'Ok', success: true, result })
        }
        return res.status(404).json({ msg: 'No Keys data found!', success: false })
    } catch (error) {
        //console.log("error on addCredential: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.addCredential = async (req, res) => {
    const name = req.body.name
    const description = req.body.description
    const credential = req.body.credential
    const id = req.body?.id
    // //console.log("req.body: ", req.body);


    try {
        // const hasCred = await bcrypt.hashSync(credential, parseInt(salt))
        const encryptedText = CryptoJS.AES.encrypt(credential, secret).toString();
        // //console.log("encryptedText: ", encryptedText);


        // const decryption = CryptoJS.AES.decrypt(encryptedText, secret).toString()
        // //console.log("decryption", decryption);

        const result = await Credential.findOneAndUpdate(
            { $or: [{ name: name }, { _id: id }] },
            { name: name, description: description, credential: encryptedText },
            { new: true, upsert: true }
        );
        if (result) {
            return res.status(200).json({ msg: `Credential ${id ? name + ' updated' : name + ' added'} successfully.`, success: true, result })
        }
        return res.status(400).json({ msg: `Failed to add credential!`, success: false })
    } catch (error) {
        //console.log("error on addCredential: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.decryptKeyAndSend = async (req, res) => {
    const key = req.body.key
    try {
        if (!key) {
            return res.status(400).json({ msg: 'Key is required!', success: false })
        }
        // const decryptedText = CryptoJS.AES.decrypt(encryptedText, secret).toString(CryptoJS.enc.Utf8);
        const decryption = CryptoJS.AES.decrypt(key, secret).toString(CryptoJS.enc.Utf8)
        if (decryption) {
            return res.status(200).json({ msg: 'Decrypted successfully.', success: true, result: decryption })
        }
        return res.status(400).json({ msg: 'Failed to decrypt!', success: false })
    } catch (error) {
        //console.log("error on decryptKeyAndSend: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.deleteKey = async (req, res) => {
    const id = req.params.id
    try {
        const result = await Credential.findByIdAndDelete(id)
        if (result) {
            return res.status(200).json({ msg: 'Api key deleted successfully.', success: true })
        }
        return res.status(400).json({msg: 'Failed to delete api key!', success: false})
    } catch (error) {
        //console.log("error on deleteKey: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}