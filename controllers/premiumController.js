const { FoodLog, Food, User } = require('../models');
const { Op } = require('sequelize');

// GET /premium/upgrade
exports.getUpgrade = (req, res) => {
  res.render('premium/upgrade');
};

// POST /premium/upgrade
exports.postUpgrade = async (req, res) => {
  try {
    await User.update({ role: 'premium' }, { where: { id: req.session.user.id } });
    req.session.user.role = 'premium';
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.redirect('/premium/upgrade');
  }
};

// GET /premium/history
exports.getHistory = async (req, res) => {
  try {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const logs = await FoodLog.findAll({
      where: {
        userId: req.session.user.id,
        logDate: { [Op.in]: dates }
      },
      include: [{ model: Food }]
    });

    const history = dates.map(date => {
      const dayLogs = logs.filter(l => l.logDate === date);
      const totalCalories = dayLogs.reduce((sum, l) => sum + l.totalCalories, 0);
      return { date, totalCalories, entryCount: dayLogs.length };
    });

    res.render('premium/history', { history });
  } catch (err) {
    console.error(err);
    res.render('premium/history', { history: [], error: 'Could not load history.' });
  }
};

// GET /premium/history/:date
exports.getDayLog = async (req, res) => {
  const { date } = req.params;
  try {
    const logs = await FoodLog.findAll({
      where: { userId: req.session.user.id, logDate: date },
      include: [{ model: Food }],
      order: [['createdAt', 'ASC']]
    });
    const totalCalories = logs.reduce((sum, l) => sum + l.totalCalories, 0);
    res.render('premium/day-log', { logs, totalCalories, date });
  } catch (err) {
    console.error(err);
    res.redirect('/premium/history');
  }
};