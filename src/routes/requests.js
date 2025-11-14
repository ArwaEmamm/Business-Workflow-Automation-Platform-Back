const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Create new request for a specific workflow
router.post(
  '/workflow/:workflowId',
  authMiddleware,
  upload.array('attachments', 5),
  requestController.createNewRequest
);

// Get all requests
router.get('/', authMiddleware, requestController.getAllRequests);

// Get pending requests (must come before /:id to avoid conflict)
router.get('/pending', authMiddleware, requestController.getPendingRequests);

// Get single request
router.get('/:id', authMiddleware, requestController.getSingleRequestById);

// Handle approval
router.post('/:requestId/approve', authMiddleware, requestController.handleApproval);

module.exports = router;