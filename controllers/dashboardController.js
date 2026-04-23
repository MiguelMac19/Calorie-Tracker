const { FoodLog, Food } = require('../models');

// GET /dashboard
exports.getDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const logs = await FoodLog.findAll({
      where: { userId: req.session.user.id, logDate: today },
      include: [{ model: Food }],
      order: [['createdAt', 'ASC']]
    });

    const totalCalories = logs.reduce((sum, log) => sum + log.totalCalories, 0);

    res.render('dashboard', { logs, totalCalories, today });
  } catch (err) {
    console.error(err);
    res.render('dashboard', { logs: [], totalCalories: 0, today: new Date().toISOString().split('T')[0], error: 'Could not load dashboard.' });
  }
};

// POST /dashboard/remove/:id
exports.removeLogEntry = async (req, res) => {
  try {
    const log = await FoodLog.findOne({ where: { id: req.params.id, userId: req.session.user.id } });
    if (!log) return res.status(404).json({ error: 'Entry not found.' });
    await log.destroy();
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard');
  }
};