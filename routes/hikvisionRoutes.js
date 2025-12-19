const express = require('express');
const router = express.Router();
const HikvisionController = require('../controllers/hikvisionController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');

// Get Access Control Events
router.get('/events', 
  AuthMiddleware.authenticate,
  HikvisionController.getAccessControlEvents
);

// Search Access Control Events with custom parameters
router.post('/events/search',
  AuthMiddleware.authenticate,
  HikvisionController.searchAccessControlEvents
);

// Get Access Control Events filtered by Project
router.get('/events/project/:projectId',
  AuthMiddleware.authenticate,
  HikvisionController.getAccessControlEventsByProject
);

module.exports = router;

