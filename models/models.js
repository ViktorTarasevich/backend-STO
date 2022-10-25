const sequelize = require('../db')
const Sequelize = require("sequelize");
const {DataTypes} = require('sequelize')

const userLogin = sequelize.define('login_data', {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  email: {type: DataTypes.STRING, unique: true},
  name: {type: DataTypes.STRING},
  lastname: {type: DataTypes.STRING},
  phone: {type: DataTypes.TEXT},
  password: {type: DataTypes.STRING}
})

const resetToken = sequelize.define ('reset_token', {
    token: { type: DataTypes.STRING },
    // tokenExpires : {
    //     type: Sequelize.DATE,
    //     defaultValue: Date.now() + 60
    // },
    //created: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    timestamps: true
  })

userLogin.hasOne(resetToken,{ foreignKey: 'login_id', onDelete: "cascade"})
resetToken.belongsTo(userLogin,{ foreignKey: 'login_id'})

module.exports = {
  UserLogin: userLogin,
  ResetToken: resetToken
}
