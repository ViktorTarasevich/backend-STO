const models = require("../models/models");
const RefreshToken = require("../models/refreshToken.model");
const config = require("../config/auth.config");
const { v4: uuidv4 } = require("uuid");
const {UserLogin, ResetToken} = require("../models/models");
const bcrypt = require("bcryptjs");
const crypto = require('crypto');
const jwt = require("jsonwebtoken");
const Mailgun = require('mailgun-js');
const ApiError = require("../error/ApiError");
const Sequelize = require("sequelize");
const { Op } = require("sequelize");
const moment = require("moment");
const fs = require('fs');
const { post } = require("curl");
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");

const createToken = async (user) => {
    let expiredAt = new Date()
    expiredAt.setSeconds(expiredAt.getSeconds() + config.jwtRefreshExpiration)
    let _token = uuidv4()
    let refreshToken = await RefreshToken.create({
        token: _token,
        userId: user.id,
        expiryDate: expiredAt.getTime(),
    })
    return refreshToken.token
}

function randomTokenString() {
    return crypto.randomBytes(32).toString('hex')
}
async function hashPassword(password) {
    console.log('password-----', password)
    const resultPassword = bcrypt.hash(password, 12)
    return resultPassword
}
const generateJwt = (id, email) => {
    return jwt.sign(
        {id, email},
        process.env.SECRET_KEY,
        {expiresIn: '24h'}
    )
}
const template = fs.readFileSync('./html/email.html', {encoding:'utf8', flag:'r'});

async function sendMail(template, to) {
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
            subject: 'Forgot Password',
            html: template
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

exports.forgotPassword = async (req, res) => {
    const { email } = req.body
    console.log(req.body)
    try {
        const userLogin = await UserLogin.findOne({
            where: {email: email}
        })
        if(!userLogin) {
            res.status(403).json({ error: "Invalid email" })
        } else {
            const token = await new ResetToken({
                login_id: userLogin.id,
                token: randomTokenString(),
            }).save()
            console.log('token', token)
            const user = await UserLogin.findOne({
                attributes: ['name', 'lastname'],
                where: {id:  userLogin.id}
            })
            console.log('user', user )
            let compiledTemlate = template.replace(`{%token%}`, token.token).replace(`{%fname%}`, user.name+' '+user.lastname)
            sendMail(compiledTemlate, email)
                .then(() => {
                    console.log('SEND EMAIL')
                    res.status(200).json({ message: 'Емейл отправлен' })
                })
        }
    } catch(error) {
        //console.log(error)
        res.status(500).json({ message: error.message })
    }
}

exports.checkToken = async (req, res) => {
    // Get the token from params
    const token = req.body.token

    // if there is a token we need to decoded and check for no errors
    if(token) {
        //console.log(moment())
        const resetToken = await ResetToken.findOne({

            where: {token: token,
            createdAt:{
                [Op.gte]: moment().subtract(10,'minute')
                }
            }
        })
        if (resetToken){
            res.status(200).json({message: 'ok'})
        }else {
            res.status(403).json({message:'Sorry, your link has expired'})
        }
    }
    else{
        res.status(403).json({message:'Sorry, your link has expired'})
    }
 }

exports.setNewPassword = async (req, res) => {
    const {password, token} = req.body
    console.log("------------token------", token)
    ResetToken.findOne({
        where: {token: token,
            createdAt:{
                [Op.gte]: moment().subtract(10,'minute')
            }
        }
     }).then(async resetToken => {
        //console.log("------------resetToken------")
        //console.log(resetToken)
        if (!resetToken) {
            res.status(403).json({message: 'Provided link has expired'})
        } else {
        const hashPassword = await bcrypt.hash(password, 12)
        const userLogin = await UserLogin.findOne({
            where: { id: resetToken.login_id}
        })
            await userLogin.update({
                password: hashPassword
            })
            await ResetToken.destroy({
                where: {
                    login_id: resetToken.login_id
                }
            })
            res.status(200).json({message: 'Password updated'})
        }
    }).catch(err => {
        res.status(403).json(ApiError.badRequest('Provided link has expired'))
        //console.log(err)
    })
}

exports.postSignIn = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const exitUser = await UserLogin.findOne({
            where: {
                email: email,
            },
        })
        if (exitUser) {
            return res.status(409).json({
                error: "Email already exist, please pick another email! ",
            })
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        const user = await UserLogin.create({
            email: email,
            password: hashedPassword
        })
        res.status(200).json({
            message: "User created",
            user: { id: user.id, email: user.email },
        })
    } catch (err) {
        //console.log(err)
    }
}

exports.registration = async (req, res, next) => {
    try {
        const {email, password, name, lastname, phone} = req.body
        console.log('email, password=====', email, password)
        if (!email || !password) {
            return next(ApiError.badRequest('Некорректный email или password'))
        }
        const candidate = await UserLogin.findOne({where: {email}})
        if (candidate) {
            return next(ApiError.badRequest('Пользователь с таким email уже существует'))
        }
        const hashPass = await hashPassword(password)
        const toLoweCase = email.toLowerCase()
        console.log(toLoweCase)

        const user = await UserLogin.create(
            {
                email: toLoweCase,
                password: hashPass,
                name: name,
                lastname: lastname,
                phone: phone
            })
        const token = generateJwt({id: user.id, email})
        return res.json({token})
    } catch (err) {
        //console.log(err)
    }
}

exports.postLogin = async (req, res) => {
    try {
        const { email, password } = req.body
        //console.log("email password: ", email, password)
        console.log(email)
        const user = await UserLogin.findOne({
            where: {
                email: email,
            },
        })
        console.log('User email', user)
        //console.log("user found :", user)
        if (!user) {
            return res.status(404).json({ message: "User not found." })
        }
        const isPassValid = bcrypt.compareSync(password, user.password)
        console.log("isPassValid  ", isPassValid)
        if (!isPassValid) {
            return res
                .status(401)
                .json({ accessToken: null, message: "Invalid password!" })
        }
        console.log('2', isPassValid)
        const userData = await UserLogin.findOne({
                where:{id: user.id},
        })
        console.log("userData=======", userData)

        const token = jwt.sign({ id: userData.id }, config.secret, {
            expiresIn: config.jwtExpiration,
        });
        console.log(token)
        let refreshToken = await createToken(userData)
        res.status(200).json({
            token: token,
            refresh_token: refreshToken,
        });
        return res.status(200).json({userData})
    } catch (err) {
        //console.log(err)
    }
}

exports.postRefreshToken = async (req, res, next) => {
    const { refresh_token: requestToken } = req.body

    try {
        if (!requestToken) {
            return res.status(403).json({ message: "Your session was expired. Please login again!" })
        }
        console.log('Getting refresh token')
        let refreshToken = await RefreshToken.findOne({
            where: { token: requestToken },
        })
        if (!refreshToken) {
            return res.status(403).json({ message: "Your session was expired. Please login again!" })
        }
        if (refreshToken.expiryDate.getTime() < new Date().getTime()) {
            await RefreshToken.destroy({ where: { id: refreshToken.id } })

            return res.status(403).json({
                message: "Your session was expired. Please login again!",
            })
        }
        console.log("---refreshToken---",refreshToken)
        //const user = await refreshToken.getUser()
        if(!req.userId){
          return res.status(403).json({
            message: "Your session was expired. Please login again!",
          })

        }
        let newAccessToken = jwt.sign({ id: req.userId }, config.secret, {
            expiresIn: config.jwtExpiration,
        })
        return res.status(200).json({
            token: newAccessToken,
            refresh_token: refreshToken.token,
        })
    } catch (err) {
        console.log(err)
    }
}

exports.getUser = async (req, res, next) => {
    //console.log("request body-------------------------------------", req.body)
    if(!req.userId){res.status(401).json({message:'Please log in again'})}
    else{
        const userData = await UserLogin.findOne({
            include: [{
                model: UserLogin,
                required: true,
                where:{id: req.userId}}],
        })
        //console.log("userInfo-------", userData)
    res.status(200).json({
        user: {
            id: req.userId,
       //     fullname: userData.name,
       //     email: userData.email,
        },
    })}
}

exports.getAllUsers = async (req, res, next) => {
    const users = await User.findAll({
        attributes: ["id", "fullname", "email"],
    })
    res.status(200).json({ users: users })
}

