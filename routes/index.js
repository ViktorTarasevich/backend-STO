const Route = require('express')
const router = new Route()
const userRouter = require('./login.router')
const sendEmail = require('./sendingEmail.router')

router.use('/auth', userRouter)
router.use('/notification', sendEmail)

module.exports = router
