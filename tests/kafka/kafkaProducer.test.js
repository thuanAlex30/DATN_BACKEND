const kafkaProducer = require('../../services/kafkaProducer');
const { eventTypes } = require('../../config/kafkaConfig');

describe('Kafka Producer', () => {
  beforeAll(async () => {
    await kafkaProducer.initialize();
  });

  afterAll(async () => {
    await kafkaProducer.disconnect();
  });

  describe('Project Events', () => {
    test('should send project created event', async () => {
      const projectData = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Project',
        status: 'planning',
        progress: 0,
        site_id: '507f1f77bcf86cd799439013',
        leader_id: '507f1f77bcf86cd799439012'
      };

      const metadata = {
        userId: '507f1f77bcf86cd799439012',
        userRole: 'manager',
        userFullName: 'John Doe'
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_CREATED,
        projectData,
        metadata
      );

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
    });

    test('should send project updated event', async () => {
      const projectData = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Updated Project',
        status: 'in_progress',
        progress: 50
      };

      const metadata = {
        userId: '507f1f77bcf86cd799439012',
        userRole: 'manager'
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_UPDATED,
        projectData,
        metadata
      );

      expect(result.success).toBe(true);
    });

    test('should send project progress updated event', async () => {
      const projectData = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Project',
        progress: 75
      };

      const metadata = {
        userId: '507f1f77bcf86cd799439012',
        userRole: 'manager'
      };

      const result = await kafkaProducer.sendProjectEvent(
        eventTypes.PROJECT_PROGRESS_UPDATED,
        projectData,
        metadata
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Task Events', () => {
    test('should send task created event', async () => {
      const taskData = {
        _id: '507f1f77bcf86cd799439014',
        name: 'Test Task',
        project_id: '507f1f77bcf86cd799439011',
        status: 'pending',
        priority: 'high',
        assignee_id: '507f1f77bcf86cd799439012'
      };

      const metadata = {
        userId: '507f1f77bcf86cd799439012',
        userRole: 'manager'
      };

      const result = await kafkaProducer.sendTaskEvent(
        eventTypes.TASK_CREATED,
        taskData,
        metadata
      );

      expect(result.success).toBe(true);
    });

    test('should send task status updated event', async () => {
      const taskData = {
        _id: '507f1f77bcf86cd799439014',
        name: 'Test Task',
        status: 'in_progress'
      };

      const metadata = {
        userId: '507f1f77bcf86cd799439012',
        userRole: 'manager'
      };

      const result = await kafkaProducer.sendTaskEvent(
        eventTypes.TASK_STATUS_UPDATED,
        taskData,
        metadata
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Incident Events', () => {
    test('should send incident reported event', async () => {
      const incidentData = {
        _id: '507f1f77bcf86cd799439015',
        title: 'Test Incident',
        description: 'Test incident description',
        severity: 'medium',
        status: 'open',
        location: 'Site A',
        reporter_id: '507f1f77bcf86cd799439012'
      };

      const metadata = {
        userId: '507f1f77bcf86cd799439012',
        userRole: 'worker'
      };

      const result = await kafkaProducer.sendIncidentEvent(
        eventTypes.INCIDENT_REPORTED,
        incidentData,
        metadata
      );

      expect(result.success).toBe(true);
    });

    test('should send incident resolved event', async () => {
      const incidentData = {
        _id: '507f1f77bcf86cd799439015',
        title: 'Test Incident',
        status: 'resolved'
      };

      const metadata = {
        userId: '507f1f77bcf86cd799439012',
        userRole: 'manager'
      };

      const result = await kafkaProducer.sendIncidentEvent(
        eventTypes.INCIDENT_RESOLVED,
        incidentData,
        metadata
      );

      expect(result.success).toBe(true);
    });
  });

  describe('PPE Events', () => {
    test('should send PPE item created event', async () => {
      const ppeData = {
        _id: '507f1f77bcf86cd799439016',
        name: 'Safety Helmet',
        category: 'head_protection',
        quantity: 10,
        status: 'available',
        site_id: '507f1f77bcf86cd799439013'
      };

      const metadata = {
        userId: '507f1f77bcf86cd799439012',
        userRole: 'manager'
      };

      const result = await kafkaProducer.sendPPEEvent(
        eventTypes.PPE_ITEM_CREATED,
        ppeData,
        metadata
      );

      expect(result.success).toBe(true);
    });

    test('should send PPE item assigned event', async () => {
      const ppeData = {
        _id: '507f1f77bcf86cd799439016',
        name: 'Safety Helmet',
        status: 'assigned',
        assignedTo: '507f1f77bcf86cd799439012'
      };

      const metadata = {
        userId: '507f1f77bcf86cd799439012',
        userRole: 'manager'
      };

      const result = await kafkaProducer.sendPPEEvent(
        eventTypes.PPE_ITEM_ASSIGNED,
        ppeData,
        metadata
      );

      expect(result.success).toBe(true);
    });
  });

  describe('User Events', () => {
    test('should send user registered event', async () => {
      const userData = {
        _id: '507f1f77bcf86cd799439017',
        email: 'test@example.com',
        full_name: 'John Doe',
        role: 'worker',
        department: 'Construction',
        status: 'active'
      };

      const metadata = {
        userId: '507f1f77bcf86cd799439012',
        userRole: 'admin'
      };

      const result = await kafkaProducer.sendUserEvent(
        eventTypes.USER_REGISTERED,
        userData,
        metadata
      );

      expect(result.success).toBe(true);
    });

    test('should send user login event', async () => {
      const userData = {
        _id: '507f1f77bcf86cd799439017',
        email: 'test@example.com',
        last_login: new Date().toISOString()
      };

      const metadata = {
        userId: '507f1f77bcf86cd799439017',
        userRole: 'worker',
        ipAddress: '192.168.1.1'
      };

      const result = await kafkaProducer.sendUserEvent(
        eventTypes.USER_LOGIN,
        userData,
        metadata
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Notification Events', () => {
    test('should send notification sent event', async () => {
      const notificationData = {
        _id: '507f1f77bcf86cd799439018',
        title: 'Test Notification',
        message: 'Test notification message',
        type: 'info',
        priority: 'normal',
        target_users: ['507f1f77bcf86cd799439012']
      };

      const metadata = {
        userId: '507f1f77bcf86cd799439012',
        userRole: 'manager'
      };

      const result = await kafkaProducer.sendNotificationEvent(
        eventTypes.NOTIFICATION_SENT,
        notificationData,
        metadata
      );

      expect(result.success).toBe(true);
    });
  });

  describe('System Events', () => {
    test('should send system startup event', async () => {
      const systemData = {
        systemId: 'safety-management-system',
        component: 'backend',
        level: 'info',
        message: 'System started successfully'
      };

      const metadata = {
        userId: 'system',
        userRole: 'system'
      };

      const result = await kafkaProducer.sendSystemEvent(
        eventTypes.SYSTEM_STARTUP,
        systemData,
        metadata
      );

      expect(result.success).toBe(true);
    });

    test('should send system error event', async () => {
      const systemData = {
        systemId: 'safety-management-system',
        component: 'database',
        level: 'error',
        message: 'Database connection failed'
      };

      const metadata = {
        userId: 'system',
        userRole: 'system'
      };

      const result = await kafkaProducer.sendSystemEvent(
        eventTypes.SYSTEM_ERROR,
        systemData,
        metadata
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid event data', async () => {
      const result = await kafkaProducer.sendEvent('test-topic', null);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid event data');
    });

    test('should handle missing event type', async () => {
      const result = await kafkaProducer.sendEvent('test-topic', {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('eventType is required');
    });
  });

  describe('Connection Status', () => {
    test('should return connection status', () => {
      const status = kafkaProducer.getStatus();
      expect(status).toHaveProperty('isConnected');
      expect(status).toHaveProperty('isInitialized');
      expect(typeof status.isConnected).toBe('boolean');
      expect(typeof status.isInitialized).toBe('boolean');
    });
  });
});
