const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const roleRoutes = require('./roleRoutes');
const departmentRoutes = require('./departmentRoutes');
const positionRoutes = require('./positionRoutes');
const systemLogRoutes = require('./systemLogRoutes');
const notificationRoutes = require('./notificationRoutes');
const ppeRoutes = require('./ppeRoutes');
const ppeAdvancedRoutes = require('./ppeAdvanced');
const projectRoutes = require('./projectRoutes');
const incidentRoutes = require('./incidentRoutes');
const trainingRoutes = require('./trainingRoutes');
const taskWorkflowRoutes = require('./taskWorkflowRoutes');
const trainerModuleRoutes = require('./trainerModuleRoutes');
const safetyOfficerRoutes = require('./safetyOfficerRoutes');
const warehouseModuleRoutes = require('./warehouseModuleRoutes');
const maintenanceModuleRoutes = require('./maintenanceModuleRoutes');

// Advanced Project Management Routes
const projectTaskRoutes = require('./projectTaskRoutes');
const projectMilestoneRoutes = require('./projectMilestoneRoutes');
const siteRoutes = require('./siteRoutes');
const siteAreaRoutes = require('./siteAreaRoutes');
const workLocationRoutes = require('./workLocationRoutes');
const projectResourceRoutes = require('./projectResourceRoutes');
const projectRiskRoutes = require('./projectRiskRoutes');
const projectChangeRequestRoutes = require('./projectChangeRequestRoutes');
const projectStatusReportRoutes = require('./projectStatusReportRoutes');
const qualityCheckpointRoutes = require('./qualityCheckpointRoutes');
const projectCommunicationRoutes = require('./projectCommunicationRoutes');
const tenantRoutes = require('./tenantRoutes');
const adminRoutes = require('./adminRoutes');
const companyAdminRoutes = require('./companyAdminRoutes');

console.log('Loading kafkaMonitor...');
const kafkaMonitor = require('../services/kafkaMonitor');
console.log('kafkaMonitor loaded:', typeof kafkaMonitor);

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  try {
    console.log('Health check called, kafkaMonitor:', typeof kafkaMonitor);
    const kafkaMetrics = kafkaMonitor.getMetrics();
    console.log('Kafka metrics:', kafkaMetrics);
    res.json({
      success: true,
      message: 'Safety Management System API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'connected',
        websocket: 'active',
        kafka: kafkaMetrics.isMonitoring ? 'monitoring' : 'inactive'
      },
      kafka: {
        monitoring: kafkaMetrics.isMonitoring,
        producer: {
          connected: kafkaMetrics.producer.isConnected,
          messagesSent: kafkaMetrics.producer.messagesSent,
          errors: kafkaMetrics.producer.errors,
          averageLatency: kafkaMetrics.producer.averageLatency
        },
        consumer: {
          connected: kafkaMetrics.consumer.isConnected,
          messagesProcessed: kafkaMetrics.consumer.messagesProcessed,
          errors: kafkaMetrics.consumer.errors
        },
        dlq: {
          messagesInDLQ: kafkaMetrics.dlq.messagesInDLQ
        }
      },
      endpoints: {
        auth: '/api/auth',
        users: '/api/users',
        roles: '/api/roles',
        departments: '/api/departments',
        positions: '/api/positions',
        systemLogs: '/api/system-logs',
        notifications: '/api/notifications',
        ppe: '/api/ppe',
        ppeAdvanced: '/api/ppe-advanced',
        projects: '/api/projects',
        training: '/api/training',
        sites: '/api/sites',
        siteAreas: '/api/site-areas',
        workLocations: '/api/work-locations',
        projectTasks: '/api/project-tasks',
        projectMilestones: '/api/project-milestones',
        projectResources: '/api/project-resources',
        projectRisks: '/api/project-risks',
        projectChangeRequests: '/api/project-change-requests',
        projectStatusReports: '/api/project-status-reports',
        qualityCheckpoints: '/api/quality-checkpoints',
        projectCommunication: '/api/project-communication'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.json({
      success: true,
      message: 'Safety Management System API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      error: error.message,
      endpoints: {
        auth: '/api/auth',
        users: '/api/users',
        roles: '/api/roles',
        departments: '/api/departments',
        positions: '/api/positions',
        systemLogs: '/api/system-logs',
        notifications: '/api/notifications',
        ppe: '/api/ppe',
        ppeAdvanced: '/api/ppe-advanced',
        projects: '/api/projects',
        training: '/api/training',
        sites: '/api/sites',
        siteAreas: '/api/site-areas',
        workLocations: '/api/work-locations',
        projectTasks: '/api/project-tasks',
        projectMilestones: '/api/project-milestones',
        projectResources: '/api/project-resources',
        projectRisks: '/api/project-risks',
        projectChangeRequests: '/api/project-change-requests',
        projectStatusReports: '/api/project-status-reports',
        qualityCheckpoints: '/api/quality-checkpoints',
        projectCommunication: '/api/project-communication'
      }
    });
  }
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
router.use('/ppe-advanced', ppeAdvancedRoutes);
router.use('/projects', projectRoutes);
router.use('/incidents', incidentRoutes);
router.use('/training', trainingRoutes);
router.use('/trainer-module', trainerModuleRoutes);
router.use('/safety-officer', safetyOfficerRoutes);
router.use('/warehouse', warehouseModuleRoutes);
router.use('/maintenance', maintenanceModuleRoutes);

// Advanced Project Management Routes
router.use('/project-tasks', projectTaskRoutes);
router.use('/project-milestones', projectMilestoneRoutes);
router.use('/sites', siteRoutes);
router.use('/site-areas', siteAreaRoutes);
router.use('/work-locations', workLocationRoutes);
router.use('/project-resources', projectResourceRoutes);
router.use('/project-risks', projectRiskRoutes);
router.use('/project-change-requests', projectChangeRequestRoutes);
router.use('/project-status-reports', projectStatusReportRoutes);
router.use('/quality-checkpoints', qualityCheckpointRoutes);
router.use('/project-communication', projectCommunicationRoutes);

// Task workflow (Dept Header → Manager → Leader → Employee)
router.use('/task-workflows', taskWorkflowRoutes);

// Admin and Tenant Management Routes
router.use('/admin', adminRoutes);
router.use('/tenants', tenantRoutes);
router.use('/company-admin', companyAdminRoutes);

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
        'GET /api/training/dashboard/stats',
        'GET /api/sites',
        'POST /api/sites',
        'GET /api/sites/:id',
        'PUT /api/sites/:id',
        'DELETE /api/sites/:id',
        'GET /api/site-areas/site/:siteId/areas',
        'GET /api/site-areas/areas',
        'POST /api/site-areas/areas',
        'GET /api/site-areas/areas/:id',
        'PUT /api/site-areas/areas/:id',
        'DELETE /api/site-areas/areas/:id',
        'GET /api/work-locations',
        'GET /api/project-tasks',
        'GET /api/project-milestones',
        'GET /api/project-resources',
        'GET /api/project-risks',
        'GET /api/project-change-requests',
        'GET /api/project-status-reports',
        'GET /api/quality-checkpoints'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
