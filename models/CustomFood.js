const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CustomFood = sequelize.define('CustomFood', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
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
  },
  protein: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  carbs: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  fat: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  fiber: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  }
});

module.exports = CustomFood;
