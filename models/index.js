const sequelize = require('../config/database');
const User = require('./User');
const Food = require('./Food');
const FoodLog = require('./FoodLog');

// Associations
User.hasMany(FoodLog, { foreignKey: 'userId', onDelete: 'CASCADE' });
FoodLog.belongsTo(User, { foreignKey: 'userId' });

Food.hasMany(FoodLog, { foreignKey: 'foodId' });
FoodLog.belongsTo(Food, { foreignKey: 'foodId' });

module.exports = { sequelize, User, Food, FoodLog };