const sequelize = require('../config/database');
const User = require('./User');
const Food = require('./Food');
const FoodLog = require('./FoodLog');
const CustomFood = require('./CustomFood');

// Associations
User.hasMany(FoodLog, { foreignKey: 'userId', onDelete: 'CASCADE' });
FoodLog.belongsTo(User, { foreignKey: 'userId' });

Food.hasMany(FoodLog, { foreignKey: 'foodId' });
FoodLog.belongsTo(Food, { foreignKey: 'foodId' });

User.hasMany(CustomFood, { foreignKey: 'userId', onDelete: 'CASCADE' });
CustomFood.belongsTo(User, { foreignKey: 'userId' });

module.exports = { sequelize, User, Food, FoodLog, CustomFood };
