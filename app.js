require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { sequelize } = require('./models');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'calorietrack_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// Make user available in all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});


// Temporary Developer Bypass
app.use((req, res, next) => {
  // Only use this during local development
  if (!req.session.user) {
    req.session.user = {
      id: 1,
      name: 'Dev Admin',
      email: 'admin@test.com',
      role: 'admin' // To bypass requireAdmin checks
    };
  }
  next();
});

// Routes
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/dashboard'));
app.use('/food', require('./routes/food'));
app.use('/premium', require('./routes/premium'));
app.use('/admin', require('./routes/admin'));

// 404
app.use((req, res) => {
  res.status(404).render('404');
});

// Start Server
const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true }).then(() => {
  console.log('Database synced');
  app.listen(PORT, () => {
    console.log(`CalorieTrack running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error(' Database connection failed:', err.message);
});