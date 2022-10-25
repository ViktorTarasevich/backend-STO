//const {sendMail} = require('../controller/login.controller')
const {UserLogin} = require('../models/models')
const ApiError = require("../error/ApiError");
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");
const fs = require("fs");

const template1 = fs.readFileSync('./html/shoppingСart.html',{encoding:'utf8', flag:'r'});
function sendMailData(template1, to) {
    return new Promise((resolve, reject) => {
        const transporter = nodemailer.createTransport(smtpTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            auth: {
                user: 'vitjaa.tarasevich@gmail.com',
                pass: 'merhwwysxtphqofr'
            }
        }));
        const mailOptions = {
            from: 'somerealemail@gmail.com',
            to: to,
            subject: 'Product list',
            html: template1
        };
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
                reject(error)
            } else {
                console.log('Email sent: ' + info.response);
                resolve(info.response)
            }
        });
    })
}

exports.orderNotificationEmail = async (req, res) => {
    try {
        const {email, name, article} = req.body
        console.log(name, article)
        console.log(req.body)
        const userEmail = await UserLogin.findOne({
            where: { email:email }
        })
        if (!userEmail) {
            res.status(403).json({ error: "Invalid email" })
        } else {
            let compiledTemlate = template1.replace(`{%fname%}`, name+' '+article)
            await sendMailData(compiledTemlate, email, name, article)
                .then(() => {
                    console.log('SEND EMAIL')
                    res.status(200).json({ message: 'Емейл отправлен' })
                })
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
