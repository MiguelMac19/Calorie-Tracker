const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/auth');

router.get('/dashboard', requireAuth, dashboardController.getDashboard);
router.post('/dashboard/remove/:id', requireAuth, dashboardController.removeLogEntry);

module.exports = router;