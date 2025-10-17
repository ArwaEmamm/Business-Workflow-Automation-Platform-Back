const express = require('express');
const router = express.Router();

// Import sub-routers
const authRoutes = require('./auth');
const usersRoutes = require('./users');
const workflowsRoutes = require('./workflows');

// Mount sub-routers
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/workflows', workflowsRoutes);

module.exports = router;
