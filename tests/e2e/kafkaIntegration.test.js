const request = require('supertest');
const app = require('../../app');
const kafkaProducer = require('../../services/kafkaProducer');
const kafkaConsumer = require('../../services/kafkaConsumer');
const eventAggregator = require('../../services/eventAggregator');
const analyticsService = require('../../services/analyticsService');
const auditService = require('../../services/auditService');
const { eventTypes } = require('../../config/kafkaConfig');

describe('Kafka Integration E2E', () => {
  let authToken;
  let receivedEvents = [];
  let eventHandlers = {};

  beforeAll(async () => {
    // Initialize all Kafka services
    await kafkaProducer.initialize();
    await kafkaConsumer.initialize();
    await eventAggregator.initialize();
    await analyticsService.initialize();
    await auditService.initialize();

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password123'
      });
    
    authToken = loginResponse.body.data.token;

    // Set up event handlers to capture events
    setupEventHandlers();
  });

  afterAll(async () => {
    await kafkaProducer.disconnect();
    await kafkaConsumer.disconnect();
    await eventAggregator.shutdown();
    await analyticsService.shutdown();
    await auditService.shutdown();
  });

  beforeEach(() => {
    receivedEvents = [];
  });

  function setupEventHandlers() {
    // Register handlers for all event types
    const allEventTypes = Object.values(eventTypes);
    
    allEventTypes.forEach(eventType => {
      const handler = (eventData) => {
        receivedEvents.push({
          eventType,
          eventId: eventData.eventId,
          timestamp: eventData.timestamp,
          data: eventData.data,
          metadata: eventData.metadata
        });
      };
      
      eventHandlers[eventType] = handler;
      kafkaConsumer.registerEventHandler(eventType, handler);
    });
  }

  describe('Complete Event Flow', () => {
    test('should handle complete project lifecycle', async () => {
      // 1. Create Project
      const projectData = {
        name: 'E2E Test Project',
        description: 'End-to-end test project',
        status: 'planning',
        site_id: '507f1f77bcf86cd799439013',
        leader_id: '507f1f77bcf86cd799439012'
      };

      const createResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData);

      expect(createResponse.status).toBe(201);
      const projectId = createResponse.body.data._id;

      // Wait for event to be processed
      await waitForEvent(eventTypes.PROJECT_CREATED, 5000);

      // 2. Update Project Progress
      const progressResponse = await request(app)
        .put(`/api/projects/${projectId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ progress: 25 });

      expect(progressResponse.status).toBe(200);
      await waitForEvent(eventTypes.PROJECT_PROGRESS_UPDATED, 5000);

      // 3. Assign Project
      const assignResponse = await request(app)
        .put(`/api/projects/${projectId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ assignedUsers: ['507f1f77bcf86cd799439012'] });

      expect(assignResponse.status).toBe(200);
      await waitForEvent(eventTypes.PROJECT_ASSIGNED, 5000);

      // Verify events were received
      const projectEvents = receivedEvents.filter(e => e.eventType.startsWith('project_'));
      expect(projectEvents.length).toBeGreaterThanOrEqual(3);
    });

    test('should handle complete task lifecycle', async () => {
      // Create project first
      const projectData = {
        name: 'Task E2E Project',
        description: 'Project for task E2E testing',
        status: 'planning',
        site_id: '507f1f77bcf86cd799439013',
        leader_id: '507f1f77bcf86cd799439012'
      };

      const projectResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData);

      const projectId = projectResponse.body.data._id;

      // 1. Create Task
      const taskData = {
        name: 'E2E Test Task',
        description: 'End-to-end test task',
        project_id: projectId,
        status: 'pending',
        priority: 'high',
        assignee_id: '507f1f77bcf86cd799439012'
      };

      const createResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData);

      expect(createResponse.status).toBe(201);
      const taskId = createResponse.body.data._id;

      await waitForEvent(eventTypes.TASK_CREATED, 5000);

      // 2. Update Task Status
      const statusResponse = await request(app)
        .put(`/api/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'in_progress' });

      expect(statusResponse.status).toBe(200);
      await waitForEvent(eventTypes.TASK_STATUS_UPDATED, 5000);

      // 3. Update Task Progress
      const progressResponse = await request(app)
        .put(`/api/tasks/${taskId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ progress: 50 });

      expect(progressResponse.status).toBe(200);
      await waitForEvent(eventTypes.TASK_PROGRESS_UPDATED, 5000);

      // 4. Add Task Comment
      const commentResponse = await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'E2E test comment', type: 'update' });

      expect(commentResponse.status).toBe(201);
      await waitForEvent(eventTypes.TASK_COMMENT_ADDED, 5000);

      // Verify events were received
      const taskEvents = receivedEvents.filter(e => e.eventType.startsWith('task_'));
      expect(taskEvents.length).toBeGreaterThanOrEqual(4);
    });

    test('should handle complete incident lifecycle', async () => {
      // Create project first
      const projectData = {
        name: 'Incident E2E Project',
        description: 'Project for incident E2E testing',
        status: 'planning',
        site_id: '507f1f77bcf86cd799439013',
        leader_id: '507f1f77bcf86cd799439012'
      };

      const projectResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData);

      const projectId = projectResponse.body.data._id;

      // 1. Report Incident
      const incidentData = {
        title: 'E2E Test Incident',
        description: 'End-to-end test incident',
        severity: 'medium',
        status: 'open',
        location: 'Site A',
        project_id: projectId,
        site_id: '507f1f77bcf86cd799439013',
        reporter_id: '507f1f77bcf86cd799439012'
      };

      const createResponse = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incidentData);

      expect(createResponse.status).toBe(201);
      const incidentId = createResponse.body.data._id;

      await waitForEvent(eventTypes.INCIDENT_REPORTED, 5000);

      // 2. Assign Incident
      const assignResponse = await request(app)
        .put(`/api/incidents/${incidentId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ assignedTo: '507f1f77bcf86cd799439012' });

      expect(assignResponse.status).toBe(200);
      await waitForEvent(eventTypes.INCIDENT_ASSIGNED, 5000);

      // 3. Update Incident Status
      const statusResponse = await request(app)
        .put(`/api/incidents/${incidentId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'investigating' });

      expect(statusResponse.status).toBe(200);
      await waitForEvent(eventTypes.INCIDENT_STATUS_UPDATED, 5000);

      // 4. Add Incident Comment
      const commentResponse = await request(app)
        .post(`/api/incidents/${incidentId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ text: 'E2E test incident comment', type: 'update' });

      expect(commentResponse.status).toBe(201);
      await waitForEvent(eventTypes.INCIDENT_COMMENT_ADDED, 5000);

      // Verify events were received
      const incidentEvents = receivedEvents.filter(e => e.eventType.startsWith('incident_'));
      expect(incidentEvents.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Analytics Integration', () => {
    test('should track events in analytics service', async () => {
      // Create some events
      const projectData = {
        _id: 'analytics-test-project',
        name: 'Analytics Test Project',
        status: 'planning',
        progress: 0
      };

      await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_CREATED,
        projectData,
        { userId: 'test-user', userRole: 'manager' }
      );

      // Wait for event to be processed
      await waitForEvent(eventTypes.PROJECT_CREATED, 5000);

      // Get analytics data
      const dashboardData = analyticsService.getDashboardData();
      expect(dashboardData.overview.projects.total).toBeGreaterThan(0);
      expect(dashboardData.overview.projects.created).toBeGreaterThan(0);
    });

    test('should track metrics over time', async () => {
      // Generate multiple events
      const events = [];
      for (let i = 0; i < 10; i++) {
        events.push({
          eventType: eventTypes.TASK_CREATED,
          data: { taskId: `task-${i}`, taskName: `Task ${i}` },
          metadata: { userId: 'test-user', userRole: 'manager' }
        });
      }

      // Send events
      for (const event of events) {
        await kafkaProducer.sendTaskEvent(event.eventType, event.data, event.metadata);
      }

      // Wait for events to be processed
      await waitForEvents(eventTypes.TASK_CREATED, 10, 10000);

      // Check analytics
      const dashboardData = analyticsService.getDashboardData();
      expect(dashboardData.overview.tasks.total).toBeGreaterThanOrEqual(10);
      expect(dashboardData.overview.tasks.created).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Audit Integration', () => {
    test('should log events in audit service', async () => {
      // Create an event
      const projectData = {
        _id: 'audit-test-project',
        name: 'Audit Test Project',
        status: 'planning',
        progress: 0
      };

      await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_CREATED,
        projectData,
        { userId: 'test-user', userRole: 'manager' }
      );

      // Wait for event to be processed
      await waitForEvent(eventTypes.PROJECT_CREATED, 5000);

      // Get audit logs
      const auditLogs = auditService.getAuditLogs({ limit: 10 });
      expect(auditLogs.logs.length).toBeGreaterThan(0);

      // Find our event
      const ourEvent = auditLogs.logs.find(log => 
        log.eventType === eventTypes.PROJECT_CREATED && 
        log.data.projectId === 'audit-test-project'
      );
      expect(ourEvent).toBeDefined();
      expect(ourEvent.action).toBe('create');
      expect(ourEvent.category).toBe('project');
      expect(ourEvent.severity).toBe('low');
    });

    test('should generate compliance report', async () => {
      // Generate some events
      const events = [
        { type: eventTypes.PROJECT_CREATED, action: 'create' },
        { type: eventTypes.TASK_CREATED, action: 'create' },
        { type: eventTypes.INCIDENT_REPORTED, action: 'report' },
        { type: eventTypes.USER_LOGIN, action: 'login' }
      ];

      for (const event of events) {
        await kafkaProducer.sendEvent('test-topic', {
          eventType: event.type,
          data: { test: true },
          metadata: { userId: 'test-user', userRole: 'manager' }
        });
      }

      // Wait for events to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate compliance report
      const report = auditService.getComplianceReport();
      expect(report.summary.totalEvents).toBeGreaterThan(0);
      expect(report.compliance).toBeDefined();
      expect(report.categories).toBeDefined();
    });
  });

  describe('Event Aggregator Integration', () => {
    test('should process events through aggregator', async () => {
      // Create an event
      const projectData = {
        _id: 'aggregator-test-project',
        name: 'Aggregator Test Project',
        status: 'planning',
        progress: 0
      };

      await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_CREATED,
        projectData,
        { userId: 'test-user', userRole: 'manager' }
      );

      // Wait for event to be processed
      await waitForEvent(eventTypes.PROJECT_CREATED, 5000);

      // Check aggregator stats
      const stats = eventAggregator.getEventStats();
      expect(stats[eventTypes.PROJECT_CREATED]).toBeDefined();
      expect(stats[eventTypes.PROJECT_CREATED].count).toBeGreaterThan(0);

      const overallStats = eventAggregator.getOverallStats();
      expect(overallStats.totalEvents).toBeGreaterThan(0);
      expect(overallStats.isRunning).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed events gracefully', async () => {
      // Send malformed event
      const result = await kafkaProducer.sendEvent('test-topic', {
        eventType: eventTypes.PROJECT_CREATED,
        // Missing required fields
      });

      expect(result.success).toBe(true); // Should still send
    });

    test('should handle consumer errors gracefully', async () => {
      // Register a handler that throws an error
      const errorHandler = jest.fn().mockRejectedValue(new Error('Handler error'));
      kafkaConsumer.registerEventHandler('test_error_event', errorHandler);

      // Send event
      await kafkaProducer.sendEvent('test-topic', {
        eventType: 'test_error_event',
        data: { test: true },
        metadata: { userId: 'test-user' }
      });

      // Wait for event to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Handler should have been called
      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    test('should handle high volume events efficiently', async () => {
      const eventCount = 100;
      const startTime = Date.now();

      // Generate and send events
      const promises = [];
      for (let i = 0; i < eventCount; i++) {
        const promise = kafkaProducer.sendProjectEvent(
          eventTypes.PROJECT_CREATED,
          {
            _id: `perf-project-${i}`,
            name: `Performance Test Project ${i}`,
            status: 'planning',
            progress: 0
          },
          { userId: 'test-user', userRole: 'manager' }
        );
        promises.push(promise);
      }

      const results = await Promise.all(promises);
      const sendTime = Date.now() - startTime;

      // Check all events were sent successfully
      const successfulEvents = results.filter(r => r.success);
      expect(successfulEvents.length).toBe(eventCount);

      // Wait for events to be processed
      await waitForEvents(eventTypes.PROJECT_CREATED, eventCount, 15000);

      const totalTime = Date.now() - startTime;

      console.log(`Sent ${eventCount} events in ${sendTime}ms`);
      console.log(`Processed ${eventCount} events in ${totalTime}ms`);
      console.log(`Send rate: ${(eventCount / sendTime * 1000).toFixed(2)} events/second`);
      console.log(`Process rate: ${(eventCount / totalTime * 1000).toFixed(2)} events/second`);

      expect(totalTime).toBeLessThan(20000); // Should complete within 20 seconds
    });
  });

  // Helper functions
  async function waitForEvent(eventType, timeout = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const event = receivedEvents.find(e => e.eventType === eventType);
      if (event) {
        return event;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Event ${eventType} not received within ${timeout}ms`);
  }

  async function waitForEvents(eventType, count, timeout = 10000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const events = receivedEvents.filter(e => e.eventType === eventType);
      if (events.length >= count) {
        return events;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`${count} events of type ${eventType} not received within ${timeout}ms`);
  }
});
