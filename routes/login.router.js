const { Router } = require("express")
const authRouter = Router()
const authController = require("../controller/login.controller")
const isAuth = require("../middleware/isAuth")

authRouter.post("/signin", authController.postSignIn)

authRouter.post('/registration', authController.registration)

authRouter.post("/login", authController.postLogin)

authRouter.post("/refresh-token", authController.postRefreshToken)

authRouter.post('/users', isAuth, authController.getAllUsers) // you should add isAuth.js for those routes that you gonna protect them

authRouter.get('/user', isAuth, authController.getUser)

authRouter.post('/forgot-password', authController.forgotPassword) //  forgot-password

authRouter.post('/update-password', authController.setNewPassword)

authRouter.post('/check-token', authController.checkToken)

module.exports = authRouter
