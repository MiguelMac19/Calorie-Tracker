const { Food, FoodLog } = require('../models');
const { Op } = require('sequelize');

// GET /food/search
exports.searchFood = async (req, res) => {
  const query = req.query.q || '';
  try {
    const results = query
      ? await Food.findAll({ where: { name: { [Op.like]: `%${query}%` } }, limit: 20 })
      : [];
    res.render('food/search', { results, query, selectedFood: null });
  } catch (err) {
    console.error(err);
    res.render('food/search', { results: [], query, selectedFood: null, error: 'Search failed.' });
  }
};

// GET /food/:id
exports.getFoodDetail = async (req, res) => {
  const query = req.query.q || '';
  try {
    const selectedFood = await Food.findByPk(req.params.id);
    if (!selectedFood) return res.redirect('/food/search');
    const results = query
      ? await Food.findAll({ where: { name: { [Op.like]: `%${query}%` } }, limit: 20 })
      : [];
    res.render('food/search', { results, query, selectedFood });
  } catch (err) {
    console.error(err);
    res.redirect('/food/search');
  }
};

// POST /food/log
exports.logFood = async (req, res) => {
  const { foodId, servings, mealType } = req.body;
  try {
    const food = await Food.findByPk(foodId);
    if (!food) return res.redirect('/food/search');

    const totalCalories = Math.round(food.calories * parseFloat(servings));
    const today = new Date().toISOString().split('T')[0];

    await FoodLog.create({
      userId: req.session.user.id,
      foodId: food.id,
      servings: parseFloat(servings),
      mealType,
      totalCalories,
      logDate: today
    });

    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.redirect('/food/search');
  }
};