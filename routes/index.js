const express = require('express');

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const roleRoutes = require('./roleRoutes');
const departmentRoutes = require('./departmentRoutes');
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

// Advanced Project Management
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

// Tenant / Admin
const tenantRoutes = require('./tenantRoutes');
const adminRoutes = require('./adminRoutes');
const companyAdminRoutes = require('./companyAdminRoutes');

// Integrations / Others
const hikvisionRoutes = require('./hikvisionRoutes');
const chatbotRoutes = require('./chatbotRoutes');
const pricingRoutes = require('./pricingRoutes');
const weatherRoutes = require('./weatherRoutes');
const contractRoutes = require('./contractRoutes');

console.log('Loading kafkaMonitor...');
const kafkaMonitor = require('../services/kafkaMonitor');
console.log('kafkaMonitor loaded:', typeof kafkaMonitor);

const router = express.Router();

/**
 * =====================
 * Health check
 * =====================
 */
router.get('/health', (req, res) => {
  try {
    const kafkaMetrics = kafkaMonitor.getMetrics();

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
        kafka: kafkaMetrics.isMonitoring ? 'monitoring' : 'inactive',
      },
      kafka: {
        monitoring: kafkaMetrics.isMonitoring,
        producer: {
          connected: kafkaMetrics.producer.isConnected,
          messagesSent: kafkaMetrics.producer.messagesSent,
          errors: kafkaMetrics.producer.errors,
          averageLatency: kafkaMetrics.producer.averageLatency,
        },
        consumer: {
          connected: kafkaMetrics.consumer.isConnected,
          messagesProcessed: kafkaMetrics.consumer.messagesProcessed,
          errors: kafkaMetrics.consumer.errors,
        },
        dlq: {
          messagesInDLQ: kafkaMetrics.dlq.messagesInDLQ,
        },
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.json({
      success: true,
      message: 'Safety Management System API is running',
      error: error.message,
    });
  }
});

/**
 * =====================
 * API Routes
 * =====================
 */
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/departments', departmentRoutes);
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

// Advanced Project Management
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

// Task workflow
router.use('/task-workflows', taskWorkflowRoutes);

// Admin & Tenant
router.use('/admin', adminRoutes);
router.use('/tenants', tenantRoutes);
router.use('/company-admin', companyAdminRoutes);

// Integrations
router.use('/hikvision', hikvisionRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/pricing', pricingRoutes);
router.use('/integrations/weather', weatherRoutes);
router.use('/contracts', contractRoutes);

/**
 * =====================
 * Global 404 for API
 * =====================
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: `${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
