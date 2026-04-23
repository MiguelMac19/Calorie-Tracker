const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');
const { requireAuth } = require('../middleware/auth');

router.get('/search', requireAuth, foodController.searchFood);
router.get('/:id', requireAuth, foodController.getFoodDetail);
router.post('/log', requireAuth, foodController.logFood);

module.exports = router;