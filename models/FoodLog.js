const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FoodLog = sequelize.define('FoodLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  foodId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  servings: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 1
  },
  mealType: {
    type: DataTypes.ENUM('breakfast', 'lunch', 'dinner', 'snack'),
    allowNull: false
  },
  totalCalories: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  logDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
});

module.exports = FoodLog;