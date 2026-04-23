const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');

router.get('/', requireAdmin, adminController.getDashboard);
router.get('/foods', requireAdmin, adminController.getFoods);
router.get('/foods/new', requireAdmin, adminController.getNewFood);
router.post('/foods', requireAdmin, adminController.postNewFood);
router.get('/foods/:id/edit', requireAdmin, adminController.getEditFood);
router.post('/foods/:id', requireAdmin, adminController.postEditFood);
router.post('/foods/:id/delete', requireAdmin, adminController.deleteFood);
router.get('/users', requireAdmin, adminController.getUsers);
router.post('/users/:id/promote', requireAdmin, adminController.promoteUser);
router.post('/users/:id/ban', requireAdmin, adminController.toggleBan);

module.exports = router;