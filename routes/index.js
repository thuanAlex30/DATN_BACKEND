const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const roleRoutes = require('./roleRoutes');
const departmentRoutes = require('./departmentRoutes');
const positionRoutes = require('./positionRoutes');
const incidentRoutes = require('./incidentRoutes');

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
      positions: '/api/positions'
    }
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/departments', departmentRoutes);
router.use('/positions', positionRoutes);
router.use('/incidents', incidentRoutes);

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
        'GET /api/positions'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
