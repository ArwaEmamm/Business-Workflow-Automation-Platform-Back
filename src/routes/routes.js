const express = require('express');
const router = express.Router();

// Import sub-routers
const authRoutes = require('./auth');
const usersRoutes = require('./users');

// Mount sub-routers
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);

module.exports = router;
