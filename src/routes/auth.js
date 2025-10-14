const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const workflowController = require('../controllers/workflowController');
const requestController = require('../controllers/requestController');
const dashboardController = require('../controllers/dashboaredController');
const notificationController = require('../controllers/notificationController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// ✅ Auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// ✅ Workflow routes
router.post('/workflows', authMiddleware, workflowController.createNewWorkflow);
router.get('/workflows', authMiddleware, workflowController.getAllWorkflows);
router.get('/workflows/:id', authMiddleware, workflowController.getSingleWorkflowById);
router.put('/workflows/:id', authMiddleware, workflowController.updateWorkflow);
router.delete('/workflows/:id', authMiddleware, workflowController.deleteWorkflow);

// ✅ Request routes
router.post('/requests', authMiddleware, requestController.createNewRequest);
router.get('/requests',authMiddleware,requestController.getAllRequests);
router.get('/requests/:id', authMiddleware, requestController.getSingleRequestById);
router.post('/requests/:requestId/approve', authMiddleware, requestController.handleApproval);
router.get('/dashboard', authMiddleware, dashboardController.getDashboardStats);

router.get('/', authMiddleware, notificationController.getUserNotifications);

router.patch('/:id/read', authMiddleware, notificationController.markAsRead);

router.post('/', authMiddleware, notificationController.createNotification);
module.exports = router;
