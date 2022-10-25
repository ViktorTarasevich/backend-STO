require('dotenv').config()
const express = require('express')
const cors = require('cors')
const fileUpload = require('express-fileupload')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const path = require('path')
const token = require('./models/token')
const {Avatar} = require('./models/models')
const sequelize = require('./db')
const router = require('./routes/index')
const errorHandler = require('./middleware/ErrorHandlingMiddleware')
const expressPinoLogger = require('express-pino-logger')
const { Sequelize } = require("sequelize")
//const multer = require('multer');


sequelize.sync().then(()=>{console.log('synced')})
const PORT = process.env.PORT || 3000
const app = express()

app.set('trust proxy', true)

app.use(express.json())
app.use(fileUpload({}))
app.use(express.static(path.resolve(__dirname, 'static')))
//app.use(express.static(path.resolve(__dirname, 'srcImage')))
app.use(morgan('dev'))
app.use(cors())
app.use(bodyParser.json({limit: '10mb'}))
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true, parameterLimit: 10 }))
//app.use(express.bodyParser({ limit: "10mb" }))
app.use('/api', router)

const api_key = 'MAILGUN-API-KEY'

// Обработка ошибок
app.use(errorHandler)

const start = async () => {
    try {
        await sequelize.authenticate()
        await sequelize.sync()
        app.listen(process.env.PORT, () => console.log(`server start --------------------------${PORT}`))
    } catch (e) {
        console.log(e)
    }
}
start()



