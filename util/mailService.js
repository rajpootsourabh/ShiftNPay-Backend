const nodemailer = require('nodemailer')
const fs = require('fs');
const path = require('path');


exports.sendMail = async (email, name, title) => {
    try {

        // Read the HTML file content
        const htmlFilePath = path.join(__dirname, 'emailTemplate.html');
        const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');



        let transporter = nodemailer.createTransport({
            service: 'gmail',
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: "goprahul545@gmail.com",
                pass: "zdoqxecvhrdhdybv",
            },
            tls: {
                // do not fail on invalid certs
                rejectUnauthorized: false,
            },
        })

        let info = await transporter.sendMail({
            from: 'goprahul545@gmail.com',
            to: email,
            subject: title,
            text: `Hi ${name ? name : 'users'}`,
            html: htmlContent.replace('{{name}}', name ? name : 'user').replace('{{email}}', email), // Replace placeholders
        })
        if (info) {
            return info
        }
        return false
    } catch (error) {
        console.log("error on sendMail: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.sendMailToApprove = async (email, name, title) => {
    try {

        // Read the HTML file content
        const htmlFilePath = path.join(__dirname, 'emailTemplateApprove.html');
        const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');



        let transporter = nodemailer.createTransport({
            service: 'gmail',
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: "goprahul545@gmail.com",
                pass: "zdoqxecvhrdhdybv",
            },
            tls: {
                // do not fail on invalid certs
                rejectUnauthorized: false,
            },
        })

        let info = await transporter.sendMail({
            from: 'goprahul545@gmail.com',
            to: email,
            subject: title,
            text: `Hi ${name ? name : 'users'}`,
            html: htmlContent.replace('{{name}}', name ? name : 'user').replace('{{email}}', email), // Replace placeholders
        })
        if (info) {
            return info
        }
        return false
    } catch (error) {
        console.log("error on sendMail: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.sendMailAddedToVender = async (email, name, title, venderEmail, empEmail, empPass) => {
    // console.log("email: ", email);
    // console.log("name: ", name);
    // console.log("title: ", title);
    // console.log("venderEmail: ", venderEmail);
    // console.log("empEmail: ", empEmail);
    // console.log("empPass: ", empPass);
    try {

        // Read the HTML file content
        const htmlFilePath = path.join(__dirname, 'emailTemplateEmpAdd.html');
        const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');



        let transporter = nodemailer.createTransport({
            service: 'gmail',
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: "goprahul545@gmail.com",
                pass: "zdoqxecvhrdhdybv",
            },
            tls: {
                // do not fail on invalid certs
                rejectUnauthorized: false,
            },
        })
        // here venderEmail means vender name
        let info = await transporter.sendMail({
            from: 'goprahul545@gmail.com',
            to: email,
            subject: title,
            text: `Hi ${name ? name : 'users'}`,
            html: htmlContent.replace('{{name}}', name ? name : 'user').replace('{{email}}', email).replace('{{venderEmail}}', venderEmail).replace('{{empEmail}}', empEmail).replace('{{empPass}}', empPass), // Replace placeholders
        })
        if (info) {
            return info
        }
        return false
    } catch (error) {
        console.log("error on sendMail: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}