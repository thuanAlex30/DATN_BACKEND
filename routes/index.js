const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const roleRoutes = require('./roleRoutes');
const departmentRoutes = require('./departmentRoutes');
const positionRoutes = require('./positionRoutes');
const systemLogRoutes = require('./systemLogRoutes');
const notificationRoutes = require('./notificationRoutes');
const ppeRoutes = require('./ppeRoutes');
const projectRoutes = require('./projectRoutes');
const incidentRoutes = require('./incidentRoutes');
const trainingRoutes = require('./trainingRoutes');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Safety Management System API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      roles: '/api/roles',
      departments: '/api/departments',
      positions: '/api/positions',
      systemLogs: '/api/system-logs',
      notifications: '/api/notifications',
      ppe: '/api/ppe',
      projects: '/api/projects',
      training: '/api/training'
    }
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/departments', departmentRoutes);
router.use('/positions', positionRoutes);
router.use('/system-logs', systemLogRoutes);
router.use('/notifications', notificationRoutes);
router.use('/ppe', ppeRoutes);
router.use('/projects', projectRoutes);
router.use('/incidents', incidentRoutes);
router.use('/training', trainingRoutes);

// Global 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    error: {
      code: 'ENDPOINT_NOT_FOUND',
      details: `The requested endpoint ${req.method} ${req.originalUrl} does not exist`,
      available_endpoints: [
        'GET /api/health',
        'POST /api/auth/login',
        'POST /api/auth/logout',
        'GET /api/users',
        'GET /api/roles',
        'GET /api/departments',
        'GET /api/positions',
        'GET /api/system-logs',
        'GET /api/notifications',
        'GET /api/ppe/categories',
        'GET /api/ppe/items',
        'GET /api/ppe/inventory',
        'GET /api/ppe/issuances',
        'GET /api/ppe/dashboard',
        'GET /api/projects',
        'GET /api/projects/stats',
        'GET /api/projects/sites',
        'GET /api/training/courses',
        'GET /api/training/sessions',
        'GET /api/training/enrollments',
        'POST /api/training/enrollments',
        'GET /api/training/question-banks',
        'GET /api/training/dashboard/stats'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
