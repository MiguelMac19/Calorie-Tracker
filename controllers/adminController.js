const { Food, User, FoodLog } = require('../models');
const { Op } = require('sequelize');

// GET /admin
exports.getDashboard = async (req, res) => {
  try {
    const totalUsers = await User.count({ where: { role: { [Op.ne]: 'admin' } } });
    const premiumUsers = await User.count({ where: { role: 'premium' } });
    const totalFoods = await Food.count();
    const totalLogs = await FoodLog.count();
    res.render('admin/dashboard', { totalUsers, premiumUsers, totalFoods, totalLogs });
  } catch (err) {
    console.error(err);
    res.render('admin/dashboard', { totalUsers: 0, premiumUsers: 0, totalFoods: 0, totalLogs: 0 });
  }
};

// GET /admin/foods
exports.getFoods = async (req, res) => {
  const query = req.query.q || '';
  try {
    const foods = await Food.findAll({
      where: query ? { name: { [Op.like]: `%${query}%` } } : {},
      order: [['name', 'ASC']]
    });
    res.render('admin/foods', { foods, query, success: req.query.success, error: null });
  } catch (err) {
    console.error(err);
    res.render('admin/foods', { foods: [], query, error: 'Could not load foods.' });
  }
};

// GET /admin/foods/new
exports.getNewFood = (req, res) => {
  res.render('admin/food-form', { food: null, error: null });
};

// POST /admin/foods
exports.postNewFood = async (req, res) => {
  const { name, calories, servingSize, servingUnit, protein, carbs, fat, fiber } = req.body;
  try {
    await Food.create({
      name,
      calories: parseInt(calories),
      servingSize: parseFloat(servingSize),
      servingUnit,
      protein: protein ? parseFloat(protein) : null,
      carbs: carbs ? parseFloat(carbs) : null,
      fat: fat ? parseFloat(fat) : null,
      fiber: fiber ? parseFloat(fiber) : null
    });
    res.redirect('/admin/foods?success=added');
  } catch (err) {
    console.error(err);
    res.render('admin/food-form', { food: null, error: 'Could not add food. Please check all fields.' });
  }
};

// GET /admin/foods/:id/edit
exports.getEditFood = async (req, res) => {
  try {
    const food = await Food.findByPk(req.params.id);
    if (!food) return res.redirect('/admin/foods');
    res.render('admin/food-form', { food, error: null });
  } catch (err) {
    res.redirect('/admin/foods');
  }
};

// POST /admin/foods/:id
exports.postEditFood = async (req, res) => {
  const { name, calories, servingSize, servingUnit, protein, carbs, fat, fiber } = req.body;
  try {
    await Food.update(
      {
        name,
        calories: parseInt(calories),
        servingSize: parseFloat(servingSize),
        servingUnit,
        protein: protein ? parseFloat(protein) : null,
        carbs: carbs ? parseFloat(carbs) : null,
        fat: fat ? parseFloat(fat) : null,
        fiber: fiber ? parseFloat(fiber) : null
      },
      { where: { id: req.params.id } }
    );
    res.redirect('/admin/foods?success=updated');
  } catch (err) {
    console.error(err);
    const food = await Food.findByPk(req.params.id);
    res.render('admin/food-form', { food, error: 'Could not update food.' });
  }
};

// POST /admin/foods/:id/delete
exports.deleteFood = async (req, res) => {
  try {
    await Food.destroy({ where: { id: req.params.id } });
    res.redirect('/admin/foods?success=deleted');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/foods');
  }
};

// GET /admin/users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { id: { [Op.ne]: req.session.user.id } },
      order: [['createdAt', 'DESC']]
    });
    res.render('admin/users', { users, success: req.query.success });
  } catch (err) {
    console.error(err);
    res.render('admin/users', { users: [], error: 'Could not load users.' });
  }
};

// POST /admin/users/:id/promote
exports.promoteUser = async (req, res) => {
  try {
    await User.update({ role: 'premium' }, { where: { id: req.params.id } });
    res.redirect('/admin/users?success=promoted');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/users');
  }
};

// POST /admin/users/:id/make-admin
exports.makeAdmin = async (req, res) => {
  try {
    await User.update({ role: 'admin' }, { where: { id: req.params.id } });
    res.redirect('/admin/users?success=made_admin');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/users');
  }
};

// POST /admin/users/:id/demote
exports.demoteUser = async (req, res) => {
  try {
    await User.update({ role: 'free' }, { where: { id: req.params.id } });
    res.redirect('/admin/users?success=demoted');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/users');
  }
};

// POST /admin/users/:id/ban
exports.toggleBan = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.redirect('/admin/users');
    await user.update({ isBanned: !user.isBanned });
    res.redirect('/admin/users?success=ban_updated');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/users');
  }
};