const kafkaConsumer = require('../../services/kafkaConsumer');
const { eventTypes } = require('../../config/kafkaConfig');

describe('Kafka Consumer', () => {
  beforeAll(async () => {
    await kafkaConsumer.initialize();
  });

  afterAll(async () => {
    await kafkaConsumer.disconnect();
  });

  describe('Initialization', () => {
    test('should initialize consumer', () => {
      const status = kafkaConsumer.getStatus();
      expect(status.isInitialized).toBe(true);
    });

    test('should return connection status', () => {
      const status = kafkaConsumer.getStatus();
      expect(status).toHaveProperty('isInitialized');
      expect(status).toHaveProperty('eventHandlersCount');
      expect(typeof status.isInitialized).toBe('boolean');
      expect(typeof status.eventHandlersCount).toBe('number');
    });
  });

  describe('Event Handling', () => {
    test('should handle project events', async () => {
      const mockEventData = {
        eventType: eventTypes.PROJECT_CREATED,
        eventId: 'test-event-id',
        data: {
          projectId: '507f1f77bcf86cd799439011',
          projectName: 'Test Project',
          status: 'planning',
          progress: 0
        },
        metadata: {
          userId: '507f1f77bcf86cd799439012',
          userRole: 'manager'
        },
        timestamp: new Date().toISOString()
      };

      // Mock event handler
      const mockHandler = jest.fn();
      kafkaConsumer.registerEventHandler(eventTypes.PROJECT_CREATED, mockHandler);

      // Process event
      await kafkaConsumer.handleEvent(mockEventData);

      expect(mockHandler).toHaveBeenCalledWith(mockEventData);
    });

    test('should handle task events', async () => {
      const mockEventData = {
        eventType: eventTypes.TASK_CREATED,
        eventId: 'test-task-event-id',
        data: {
          taskId: '507f1f77bcf86cd799439014',
          taskName: 'Test Task',
          status: 'pending',
          priority: 'high'
        },
        metadata: {
          userId: '507f1f77bcf86cd799439012',
          userRole: 'manager'
        },
        timestamp: new Date().toISOString()
      };

      const mockHandler = jest.fn();
      kafkaConsumer.registerEventHandler(eventTypes.TASK_CREATED, mockHandler);

      await kafkaConsumer.handleEvent(mockEventData);

      expect(mockHandler).toHaveBeenCalledWith(mockEventData);
    });

    test('should handle incident events', async () => {
      const mockEventData = {
        eventType: eventTypes.INCIDENT_REPORTED,
        eventId: 'test-incident-event-id',
        data: {
          incidentId: '507f1f77bcf86cd799439015',
          title: 'Test Incident',
          severity: 'medium',
          status: 'open'
        },
        metadata: {
          userId: '507f1f77bcf86cd799439012',
          userRole: 'worker'
        },
        timestamp: new Date().toISOString()
      };

      const mockHandler = jest.fn();
      kafkaConsumer.registerEventHandler(eventTypes.INCIDENT_REPORTED, mockHandler);

      await kafkaConsumer.handleEvent(mockEventData);

      expect(mockHandler).toHaveBeenCalledWith(mockEventData);
    });

    test('should handle PPE events', async () => {
      const mockEventData = {
        eventType: eventTypes.PPE_ITEM_CREATED,
        eventId: 'test-ppe-event-id',
        data: {
          ppeItemId: '507f1f77bcf86cd799439016',
          name: 'Safety Helmet',
          category: 'head_protection',
          status: 'available'
        },
        metadata: {
          userId: '507f1f77bcf86cd799439012',
          userRole: 'manager'
        },
        timestamp: new Date().toISOString()
      };

      const mockHandler = jest.fn();
      kafkaConsumer.registerEventHandler(eventTypes.PPE_ITEM_CREATED, mockHandler);

      await kafkaConsumer.handleEvent(mockEventData);

      expect(mockHandler).toHaveBeenCalledWith(mockEventData);
    });

    test('should handle user events', async () => {
      const mockEventData = {
        eventType: eventTypes.USER_REGISTERED,
        eventId: 'test-user-event-id',
        data: {
          userId: '507f1f77bcf86cd799439017',
          email: 'test@example.com',
          fullName: 'John Doe',
          role: 'worker'
        },
        metadata: {
          userId: '507f1f77bcf86cd799439012',
          userRole: 'admin'
        },
        timestamp: new Date().toISOString()
      };

      const mockHandler = jest.fn();
      kafkaConsumer.registerEventHandler(eventTypes.USER_REGISTERED, mockHandler);

      await kafkaConsumer.handleEvent(mockEventData);

      expect(mockHandler).toHaveBeenCalledWith(mockEventData);
    });

    test('should handle notification events', async () => {
      const mockEventData = {
        eventType: eventTypes.NOTIFICATION_SENT,
        eventId: 'test-notification-event-id',
        data: {
          notificationId: '507f1f77bcf86cd799439018',
          title: 'Test Notification',
          type: 'info',
          priority: 'normal'
        },
        metadata: {
          userId: '507f1f77bcf86cd799439012',
          userRole: 'manager'
        },
        timestamp: new Date().toISOString()
      };

      const mockHandler = jest.fn();
      kafkaConsumer.registerEventHandler(eventTypes.NOTIFICATION_SENT, mockHandler);

      await kafkaConsumer.handleEvent(mockEventData);

      expect(mockHandler).toHaveBeenCalledWith(mockEventData);
    });

    test('should handle system events', async () => {
      const mockEventData = {
        eventType: eventTypes.SYSTEM_STARTUP,
        eventId: 'test-system-event-id',
        data: {
          systemId: 'safety-management-system',
          component: 'backend',
          level: 'info',
          message: 'System started'
        },
        metadata: {
          userId: 'system',
          userRole: 'system'
        },
        timestamp: new Date().toISOString()
      };

      const mockHandler = jest.fn();
      kafkaConsumer.registerEventHandler(eventTypes.SYSTEM_STARTUP, mockHandler);

      await kafkaConsumer.handleEvent(mockEventData);

      expect(mockHandler).toHaveBeenCalledWith(mockEventData);
    });
  });

  describe('Error Handling', () => {
    test('should handle events without handlers gracefully', async () => {
      const mockEventData = {
        eventType: 'unknown_event_type',
        eventId: 'test-unknown-event-id',
        data: {},
        metadata: {},
        timestamp: new Date().toISOString()
      };

      // Should not throw error
      await expect(kafkaConsumer.handleEvent(mockEventData)).resolves.not.toThrow();
    });

    test('should handle malformed event data', async () => {
      const malformedEventData = {
        eventType: eventTypes.PROJECT_CREATED,
        // Missing required fields
      };

      const mockHandler = jest.fn();
      kafkaConsumer.registerEventHandler(eventTypes.PROJECT_CREATED, mockHandler);

      // Should not throw error
      await expect(kafkaConsumer.handleEvent(malformedEventData)).resolves.not.toThrow();
    });

    test('should handle handler errors gracefully', async () => {
      const mockEventData = {
        eventType: eventTypes.PROJECT_CREATED,
        eventId: 'test-error-event-id',
        data: {},
        metadata: {},
        timestamp: new Date().toISOString()
      };

      const errorHandler = jest.fn().mockRejectedValue(new Error('Handler error'));
      kafkaConsumer.registerEventHandler(eventTypes.PROJECT_CREATED, errorHandler);

      // Should not throw error
      await expect(kafkaConsumer.handleEvent(mockEventData)).resolves.not.toThrow();
    });
  });

  describe('Event Handler Management', () => {
    test('should register event handler', () => {
      const mockHandler = jest.fn();
      kafkaConsumer.registerEventHandler('test_event', mockHandler);

      const status = kafkaConsumer.getStatus();
      expect(status.eventHandlersCount).toBeGreaterThan(0);
    });

    test('should unregister event handler', () => {
      const mockHandler = jest.fn();
      kafkaConsumer.registerEventHandler('test_event_2', mockHandler);
      
      const initialCount = kafkaConsumer.getStatus().eventHandlersCount;
      
      kafkaConsumer.unregisterEventHandler('test_event_2');
      
      const finalCount = kafkaConsumer.getStatus().eventHandlersCount;
      expect(finalCount).toBeLessThan(initialCount);
    });

    test('should get registered event types', () => {
      const eventTypes = kafkaConsumer.getRegisteredEventTypes();
      expect(Array.isArray(eventTypes)).toBe(true);
      expect(eventTypes.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    test('should handle multiple events efficiently', async () => {
      const events = [];
      const eventCount = 100;

      // Generate multiple events
      for (let i = 0; i < eventCount; i++) {
        events.push({
          eventType: eventTypes.PROJECT_CREATED,
          eventId: `test-event-${i}`,
          data: { projectId: `project-${i}` },
          metadata: { userId: 'test-user' },
          timestamp: new Date().toISOString()
        });
      }

      const mockHandler = jest.fn();
      kafkaConsumer.registerEventHandler(eventTypes.PROJECT_CREATED, mockHandler);

      const startTime = Date.now();
      
      // Process all events
      await Promise.all(events.map(event => kafkaConsumer.handleEvent(event)));
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(mockHandler).toHaveBeenCalledTimes(eventCount);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
