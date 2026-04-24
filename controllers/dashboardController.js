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

    // Calculate macro totals
    let totalProtein = 0, totalCarbs = 0, totalFat = 0, totalFiber = 0;
    logs.forEach(log => {
      if (log.Food) {
        const s = log.servings;
        totalProtein += (log.Food.protein || 0) * s;
        totalCarbs += (log.Food.carbs || 0) * s;
        totalFat += (log.Food.fat || 0) * s;
        totalFiber += (log.Food.fiber || 0) * s;
      }
    });

    const macros = {
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10,
      fiber: Math.round(totalFiber * 10) / 10
    };

    res.render('dashboard', { logs, totalCalories, macros, today });
  } catch (err) {
    console.error(err);
    res.render('dashboard', {
      logs: [], totalCalories: 0,
      macros: { protein: 0, carbs: 0, fat: 0, fiber: 0 },
      today: new Date().toISOString().split('T')[0],
      error: 'Could not load dashboard.'
    });
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
