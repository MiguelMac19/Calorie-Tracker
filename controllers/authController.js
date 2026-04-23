const bcrypt = require('bcryptjs');
const { User } = require('../models');

// GET /register
exports.getRegister = (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('auth/register', { error: null });
};

// POST /register
exports.postRegister = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  try {
    if (password !== confirmPassword) {
      return res.render('auth/register', { error: 'Passwords do not match.' });
    }
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.render('auth/register', { error: 'An account with that email already exists.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashed, role: 'free' });
    res.redirect('/login?registered=1');
  } catch (err) {
    console.error(err);
    res.render('auth/register', { error: 'Something went wrong. Please try again.' });
  }
};

// GET /login
exports.getLogin = (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  const registered = req.query.registered === '1';
  res.render('auth/login', { error: null, registered });
};

// POST /login
exports.postLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.render('auth/login', { error: 'Invalid email or password.', registered: false });
    }
    if (user.isBanned) {
      return res.render('auth/login', { error: 'Your account has been suspended.', registered: false });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render('auth/login', { error: 'Invalid email or password.', registered: false });
    }
    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.render('auth/login', { error: 'Something went wrong. Please try again.', registered: false });
  }
};

// POST /logout
exports.postLogout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};