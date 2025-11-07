const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Get all users (Admin only)
router.get('/', authMiddleware, userController.getAllUsers);

// Get all requests (Admin only)
router.get('/requests', authMiddleware, userController.getAllRequests);

module.exports = router;
