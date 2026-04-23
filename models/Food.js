const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Food = sequelize.define('Food', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  calories: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  servingSize: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 1
  },
  servingUnit: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'serving'
  }
});

module.exports = Food;