const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');

//admin root/dashboard
router.get('/', requireAdmin, adminController.getDashboard);
//list custom foods
router.get('/foods', requireAdmin, adminController.getFoods);
//retrieve new custom food form
router.get('/foods/new', requireAdmin, adminController.getNewFood);
//add new custom global food
router.post('/foods', requireAdmin, adminController.postNewFood);
//edit custom global food by id
router.get('/foods/:id/edit', requireAdmin, adminController.getEditFood);
//update custom global food
router.post('/foods/:id', requireAdmin, adminController.postEditFood);
//delete custom global food
router.post('/foods/:id/delete', requireAdmin, adminController.deleteFood);
//retrieve all users
router.get('/users', requireAdmin, adminController.getUsers);
//promote user to premium
router.post('/users/:id/promote', requireAdmin, adminController.promoteUser);
//promote user to admin
router.post('/users/:id/make-admin', requireAdmin, adminController.makeAdmin);
//demote user to free
router.post('/users/:id/demote', requireAdmin, adminController.demoteUser);
//deactivate selected user
router.post('/users/:id/ban', requireAdmin, adminController.toggleBan);

module.exports = router;
