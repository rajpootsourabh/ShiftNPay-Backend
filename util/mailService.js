const nodemailer = require('nodemailer')
const fs = require('fs');
const path = require('path');
const Admin = require('../model/Admin');
const User = require('../model/User');


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
                user: "shiftnpay@gmail.com",
                pass: "jifaruninpbzszne",
            },
            tls: {
                // do not fail on invalid certs
                rejectUnauthorized: false,
            },
        })

        let info = await transporter.sendMail({
            from: 'shiftnpay@gmail.com',
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
        //console.log("error on sendMail: ", error);
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
                user: "shiftnpay@gmail.com",
                pass: "jifaruninpbzszne",
            },
            tls: {
                // do not fail on invalid certs
                rejectUnauthorized: false,
            },
        })

        let info = await transporter.sendMail({
            from: 'shiftnpay@gmail.com',
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
        //console.log("error on sendMail: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.sendMailAddedToVender = async (email, name, title, venderEmail, empEmail, empPass) => {
    // //console.log("email: ", email);
    // //console.log("name: ", name);
    // //console.log("title: ", title);
    // //console.log("venderEmail: ", venderEmail);
    // //console.log("empEmail: ", empEmail);
    // //console.log("empPass: ", empPass);
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
                user: "shiftnpay@gmail.com",
                pass: "jifaruninpbzszne",
            },
            tls: {
                // do not fail on invalid certs
                rejectUnauthorized: false,
            },
        })
        // here venderEmail means vender name
        let info = await transporter.sendMail({
            from: 'shiftnpay@gmail.com',
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
        //console.log("error on sendMail: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.sendMailOnceNewVendorRequestRecieved = async (vendor, title) => {
    try {

        //console.log('vendor : ', vendor);
        const admin = await Admin.find();
        //console.log('admin :  ' , admin);
        // Read the HTML file content
        const htmlFilePath = path.join(__dirname, 'vendorRegistrationRequest.html');
        const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
        const timeStamp = new Date();


        let transporter = nodemailer.createTransport({
            service: 'gmail',
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: "shiftnpay@gmail.com",
                pass: "jifaruninpbzszne",
            },
            tls: {
                // do not fail on invalid certs
                rejectUnauthorized: false,
            },
        })

        let info = await transporter.sendMail({
            from: 'shiftnpay@gmail.com',
            to: admin[0].email,
            // to: 'vinaybhardaj@gmail.com',
            subject: title,
            text: `Hi ${admin.name ? admin.name : 'users'}`,
            html: htmlContent.replace('{{name}}', admin ? `${admin[0].firstName} ${admin[0].lastName} ` : 'Admin')
            .replace('{{vendor_name}}', vendor.name).replace('{{timeStamp}}', vendor.createdAt), 
        })
        if (info) {
            return info
        }
        return false
    } catch (error) {
        //console.log("error on sendMail: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.sendInvoiceMail = async (data,vendorId, title) => {
    try {
        const user = await User.findById(vendorId);
        const htmlFilePath = path.join(__dirname, 'invoiceEmail.html');
        const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');


        let transporter = nodemailer.createTransport({
            service: 'gmail',
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: "shiftnpay@gmail.com",
                pass: "jifaruninpbzszne",
            },
            tls: {
                // do not fail on invalid certs
                rejectUnauthorized: false,
            },
        })

        let info = await transporter.sendMail({
            from: 'shiftnpay@gmail.com',
            to: data.email,
            // to: 'vinaybhardaj@gmail.com',
            subject: title,
            text: `Hi ${data.email ? data.email : 'User'}`,
            html: htmlContent.replace('{{email}}', data.email)
            .replace('{{invoice_url}}', data.invoiceUrl).replace('{{vendor}}', user.email), 
        })
        if (info) {
            return info
        }
        return false
    } catch (error) {
        //console.log("error on sendMail: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}


exports.sendMailOnceVendorAccountDeleted = async (vendor,emailContent, title) => {
    try {

        const admin = await Admin.find();
        // Read the HTML file content
        const htmlFilePath = path.join(__dirname, 'deleteVendor.html');
        const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
        const timeStamp = new Date();

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: "shiftnpay@gmail.com",
                pass: "jifaruninpbzszne",
            },
            tls: {
                // do not fail on invalid certs
                rejectUnauthorized: false,
            },
        })

        let info = await transporter.sendMail({
            from: 'shiftnpay@gmail.com',
            to: vendor.email,
            // to: 'vinaybhardaj@gmail.com',
            subject: title,
            text: `Hi ${admin.name ? admin.name : 'users'}`,
            html: htmlContent.replace('{{name}}', vendor ? `${vendor.name} ` : 'Vendor')
            .replace('{{email_content}}', emailContent).replace('{{time_stamp}}', timeStamp), 
        })
        if (info) {
            return info
        }
        return false
    } catch (error) {
        //console.log("error on sendMail: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}

exports.sendInviteToVendorFromAdmin = async (vendor, title) => {
    try {

        const admin = await Admin.find();
        // Read the HTML file content
        const htmlFilePath = path.join(__dirname, 'vendorInvitation.html');
        const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: "shiftnpay@gmail.com",
                pass: "jifaruninpbzszne",
            },
            tls: {
                // do not fail on invalid certs
                rejectUnauthorized: false,
            },
        })

        let info = await transporter.sendMail({
            from: 'shiftnpay@gmail.com',
            to: vendor.email,
            // to: 'vinaybhardaj@gmail.com',
            subject: title,
            text: `Hi ${admin.name ? admin.name : 'users'}`,
            html: htmlContent.replace('{{name}}', vendor ? `${vendor.name} ` : 'Vendor') , 
        })
        if (info) {
            return info
        }
        return false
    } catch (error) {
        //console.log("error on sendMail: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}



exports.shiftStartReminderToEmployee = async (employee, title,jobName,time) => {
    try {

        const htmlFilePath = path.join(__dirname, 'shiftReminderToEmployee.html');
        const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: "shiftnpay@gmail.com",
                pass: "jifaruninpbzszne",
            },
            tls: {
                rejectUnauthorized: false,
            },
        })

        let info = await transporter.sendMail({
            from: 'shiftnpay@gmail.com',
            to: employee.email,
            subject: title,
            html: htmlContent.replace('{{name}}', employee.email).replace('{{shiftName}}', jobName), 
        })
        if (info) {
            return info
        }
        return false
    } catch (error) {
        //console.log("error on sendMail: ", error);
        return res.status(500).json({ msg: error.message, err: error, success: false })
    }
}