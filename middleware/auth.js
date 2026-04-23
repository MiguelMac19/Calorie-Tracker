function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

function requirePremium(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  if (req.session.user.role === 'free') {
    return res.redirect('/premium/upgrade');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  if (req.session.user.role !== 'admin') {
    return res.status(403).render('403');
  }
  next();
}

module.exports = { requireAuth, requirePremium, requireAdmin };