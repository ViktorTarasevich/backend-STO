const { Router } = require("express")
const sendEmail = Router()
const sendController = require("../controller/sendingEmail.controller")


sendEmail.post("/order", sendController.orderNotificationEmail)


module.exports = sendEmail
