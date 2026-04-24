const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM("free", "premium", "admin"),
    defaultValue: "free",
  },
  isBanned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  premiumSince: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
  nextBillingDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: null,
  },
  cancelAtPeriodEnd: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  paymentLast4: {
    type: DataTypes.STRING(4),
    allowNull: true,
    defaultValue: null,
  },
});

module.exports = User;
