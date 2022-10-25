const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        token: { type: DataTypes.STRING },
        created: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }

    }

    const options = {
        // disable default timestamp fields (createdAt and updatedAt)
        timestamps: false
    }

    return sequelize.define('refreshToken', attributes, options);
}