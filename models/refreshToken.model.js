const db  = require("../db")
const {Sequelize} = require('sequelize')

const RefreshToken = db.define("refreshToken", {
    token: {
        type: Sequelize.STRING,
    },
    expiryDate: {
        type: Sequelize.DATE,
    },
})

module.exports = RefreshToken