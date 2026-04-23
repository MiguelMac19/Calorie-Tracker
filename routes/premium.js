const express = require('express');
const router = express.Router();
const premiumController = require('../controllers/premiumController');
const { requireAuth, requirePremium } = require('../middleware/auth');

router.get('/upgrade', requireAuth, premiumController.getUpgrade);
router.post('/upgrade', requireAuth, premiumController.postUpgrade);
router.get('/history', requirePremium, premiumController.getHistory);
router.get('/history/:date', requirePremium, premiumController.getDayLog);

module.exports = router;