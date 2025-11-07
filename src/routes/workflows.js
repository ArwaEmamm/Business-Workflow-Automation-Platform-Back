const express = require('express');
const router = express.Router();

const { authMiddleware } = require('../middlewares/authMiddleware');
const workflowController = require('../controllers/workflowController');

// Workflow routes
router.post('/', authMiddleware, workflowController.createNewWorkflow);
router.get('/', authMiddleware, workflowController.getAllWorkflows);
// Compatibility: return workflows array directly
router.get('/list', authMiddleware, workflowController.getWorkflowsList);
router.get('/:id', authMiddleware, workflowController.getSingleWorkflowById);
router.put('/:id', authMiddleware, workflowController.updateWorkflow);
router.delete('/:id', authMiddleware, workflowController.deleteWorkflow);

module.exports = router;
