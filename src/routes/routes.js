const express = require('express');
const router = express.Router();

// Import sub-routers
const authRoutes = require('./auth');
const usersRoutes = require('./users');
const workflowsRoutes = require('./workflows');
const requestsRoutes = require('./requests');
const dashboardController = require('../controllers/dashboaredController');
const settingsController = require('../controllers/settingsController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Mount sub-routers
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/workflows', workflowsRoutes);
router.use('/requests', requestsRoutes);

// Dashboard route
router.get('/dashboard', authMiddleware, dashboardController.getDashboardStats);

// Public settings (feature flags)
router.get('/settings', settingsController.getSettings);

module.exports = router;
