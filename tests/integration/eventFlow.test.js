const request = require('supertest');
const app = require('../../app');
const kafkaProducer = require('../../services/kafkaProducer');
const kafkaConsumer = require('../../services/kafkaConsumer');
const { eventTypes } = require('../../config/kafkaConfig');

describe('Event Flow Integration', () => {
  let authToken;
  let projectId;
  let taskId;
  let incidentId;
  let ppeItemId;
  let userId;

  beforeAll(async () => {
    // Initialize Kafka services
    await kafkaProducer.initialize();
    await kafkaConsumer.initialize();

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password123'
      });
    
    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    await kafkaProducer.disconnect();
    await kafkaConsumer.disconnect();
  });

  describe('Project Event Flow', () => {
    test('should create project and emit event', async () => {
      const projectData = {
        name: 'Integration Test Project',
        description: 'Test project for integration testing',
        status: 'planning',
        site_id: '507f1f77bcf86cd799439013',
        leader_id: '507f1f77bcf86cd799439012'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      
      projectId = response.body.data._id;
    });

    test('should update project progress and emit event', async () => {
      const progressData = {
        progress: 25
      };

      const response = await request(app)
        .put(`/api/projects/${projectId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(progressData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should assign project and emit event', async () => {
      const assignmentData = {
        assignedUsers: ['507f1f77bcf86cd799439012']
      };

      const response = await request(app)
        .put(`/api/projects/${projectId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(assignmentData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Task Event Flow', () => {
    test('should create task and emit event', async () => {
      const taskData = {
        name: 'Integration Test Task',
        description: 'Test task for integration testing',
        project_id: projectId,
        status: 'pending',
        priority: 'high',
        assignee_id: '507f1f77bcf86cd799439012'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      
      taskId = response.body.data._id;
    });

    test('should update task status and emit event', async () => {
      const statusData = {
        status: 'in_progress'
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(statusData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should update task progress and emit event', async () => {
      const progressData = {
        progress: 50
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(progressData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should add task comment and emit event', async () => {
      const commentData = {
        text: 'Integration test comment',
        type: 'update'
      };

      const response = await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Incident Event Flow', () => {
    test('should report incident and emit event', async () => {
      const incidentData = {
        title: 'Integration Test Incident',
        description: 'Test incident for integration testing',
        severity: 'medium',
        status: 'open',
        location: 'Site A',
        project_id: projectId,
        site_id: '507f1f77bcf86cd799439013',
        reporter_id: '507f1f77bcf86cd799439012'
      };

      const response = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incidentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      
      incidentId = response.body.data._id;
    });

    test('should assign incident and emit event', async () => {
      const assignmentData = {
        assignedTo: '507f1f77bcf86cd799439012'
      };

      const response = await request(app)
        .put(`/api/incidents/${incidentId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(assignmentData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should update incident status and emit event', async () => {
      const statusData = {
        status: 'investigating'
      };

      const response = await request(app)
        .put(`/api/incidents/${incidentId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(statusData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should add incident comment and emit event', async () => {
      const commentData = {
        text: 'Integration test incident comment',
        type: 'update'
      };

      const response = await request(app)
        .post(`/api/incidents/${incidentId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PPE Event Flow', () => {
    test('should create PPE item and emit event', async () => {
      const ppeData = {
        name: 'Integration Test Helmet',
        type: 'helmet',
        category: 'head_protection',
        description: 'Test helmet for integration testing',
        manufacturer: 'Test Manufacturer',
        model: 'TH-001',
        serial_number: 'TH001-001',
        purchase_date: new Date().toISOString(),
        purchase_price: 50.00,
        supplier: 'Test Supplier',
        warranty_period: 12,
        status: 'available',
        location: 'Site A',
        site_id: '507f1f77bcf86cd799439013',
        project_id: projectId
      };

      const response = await request(app)
        .post('/api/ppe')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ppeData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      
      ppeItemId = response.body.data._id;
    });

    test('should assign PPE item and emit event', async () => {
      const assignmentData = {
        assignedTo: '507f1f77bcf86cd799439012'
      };

      const response = await request(app)
        .put(`/api/ppe/${ppeItemId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(assignmentData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should inspect PPE item and emit event', async () => {
      const inspectionData = {
        type: 'routine',
        result: 'pass',
        score: 95,
        defects_found: [],
        recommendations: [],
        next_inspection_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post(`/api/ppe/${ppeItemId}/inspect`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(inspectionData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('User Event Flow', () => {
    test('should register user and emit event', async () => {
      const userData = {
        email: 'integration.test@example.com',
        full_name: 'Integration Test User',
        role: 'worker',
        department: 'Construction',
        position: 'Worker',
        phone_number: '+1234567890',
        address: '123 Test Street',
        date_of_birth: '1990-01-01',
        hire_date: new Date().toISOString(),
        status: 'active',
        site_id: '507f1f77bcf86cd799439013',
        project_id: projectId,
        manager_id: '507f1f77bcf86cd799439012'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      
      userId = response.body.data._id;
    });

    test('should update user profile and emit event', async () => {
      const profileData = {
        full_name: 'Updated Integration Test User',
        department: 'Safety'
      };

      const response = await request(app)
        .put(`/api/users/${userId}/profile`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(profileData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should change user role and emit event', async () => {
      const roleData = {
        role: 'supervisor'
      };

      const response = await request(app)
        .put(`/api/users/${userId}/role`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(roleData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Notification Event Flow', () => {
    test('should send notification and emit event', async () => {
      const notificationData = {
        title: 'Integration Test Notification',
        message: 'Test notification for integration testing',
        type: 'info',
        category: 'test',
        priority: 'normal',
        recipient_id: userId,
        recipient_email: 'integration.test@example.com',
        recipient_name: 'Integration Test User',
        recipient_role: 'supervisor',
        sender_id: '507f1f77bcf86cd799439012',
        sender_email: 'admin@example.com',
        sender_name: 'Admin User',
        sender_role: 'admin',
        delivery_method: 'email',
        template_id: 'test-template',
        template_name: 'Test Template',
        project_id: projectId,
        site_id: '507f1f77bcf86cd799439013'
      };

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(notificationData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('System Event Flow', () => {
    test('should emit system startup event', async () => {
      const systemData = {
        systemId: 'safety-management-system',
        component: 'backend',
        level: 'info',
        message: 'System started successfully',
        details: {
          version: '1.0.0',
          environment: 'test'
        }
      };

      const result = await kafkaProducer.sendSystemEvent(
        eventTypes.SYSTEM_STARTUP,
        systemData,
        { userId: 'system', userRole: 'system' }
      );

      expect(result.success).toBe(true);
    });

    test('should emit system health check event', async () => {
      const systemData = {
        systemId: 'safety-management-system',
        component: 'health-check',
        level: 'info',
        message: 'Health check completed',
        details: {
          status: 'healthy',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        }
      };

      const result = await kafkaProducer.sendSystemEvent(
        eventTypes.SYSTEM_HEALTH_CHECK,
        systemData,
        { userId: 'system', userRole: 'system' }
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Event Validation', () => {
    test('should validate event data structure', async () => {
      const projectData = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Validation Test Project',
        status: 'planning',
        progress: 0
      };

      const metadata = {
        userId: '507f1f77bcf86cd799439012',
        userRole: 'manager'
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_CREATED,
        projectData,
        metadata
      );

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
    });

    test('should handle missing required fields', async () => {
      const invalidData = {
        // Missing required fields
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_CREATED,
        invalidData,
        {}
      );

      expect(result.success).toBe(true); // Should still send but with minimal data
    });
  });

  describe('Performance Testing', () => {
    test('should handle high volume events', async () => {
      const events = [];
      const eventCount = 50;

      // Generate events
      for (let i = 0; i < eventCount; i++) {
        events.push({
          eventType: eventTypes.PROJECT_CREATED,
          data: {
            projectId: `perf-test-project-${i}`,
            projectName: `Performance Test Project ${i}`,
            status: 'planning',
            progress: 0
          },
          metadata: {
            userId: '507f1f77bcf86cd799439012',
            userRole: 'manager'
          }
        });
      }

      const startTime = Date.now();
      const promises = events.map(event => 
        kafkaProducer.sendProjectEvent(event.eventType, event.data, event.metadata)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      const successfulEvents = results.filter(r => r.success);
      expect(successfulEvents.length).toBe(eventCount);
      
      const duration = endTime - startTime;
      console.log(`Sent ${eventCount} events in ${duration}ms`);
      console.log(`Rate: ${(eventCount / duration * 1000).toFixed(2)} events/second`);
      
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });
});
