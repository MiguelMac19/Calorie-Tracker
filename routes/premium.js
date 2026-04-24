const express = require('express');
const router = express.Router();
const premiumController = require('../controllers/premiumController');
const { requireAuth, requirePremium } = require('../middleware/auth');

// UC-008: Upgrade to Premium
router.get('/upgrade', requireAuth, premiumController.getUpgrade);
router.post('/upgrade', requireAuth, premiumController.postUpgrade);

// UC-007: 30-Day History
router.get('/history', requirePremium, premiumController.getHistory);
router.get('/history/:date', requirePremium, premiumController.getDayLog);

// UC-011: Edit/Delete Food Log Entries
router.post('/history/:date/edit/:id', requirePremium, premiumController.editLogEntry);
router.post('/history/:date/delete/:id', requirePremium, premiumController.deleteLogEntry);

// UC-009: Manage Subscription
router.get('/subscription', requirePremium, premiumController.getSubscription);
router.post('/subscription/cancel', requirePremium, premiumController.cancelSubscription);

// UC-012: Custom Foods
router.get('/custom-foods', requirePremium, premiumController.getCustomFoods);
router.post('/custom-foods', requirePremium, premiumController.postCustomFood);
router.get('/custom-foods/:id/edit', requirePremium, premiumController.getEditCustomFood);
router.post('/custom-foods/:id', requirePremium, premiumController.updateCustomFood);
router.post('/custom-foods/:id/delete', requirePremium, premiumController.deleteCustomFood);

module.exports = router;
