const kafkaProducer = require('../../services/kafkaProducer');
const kafkaConsumer = require('../../services/kafkaConsumer');
const eventAggregator = require('../../services/eventAggregator');
const analyticsService = require('../../services/analyticsService');
const auditService = require('../../services/auditService');
const { eventTypes } = require('../../config/kafkaConfig');

describe('Kafka Stress Tests', () => {
  let receivedEvents = [];
  let eventHandlers = {};

  beforeAll(async () => {
    // Initialize all Kafka services
    await kafkaProducer.initialize();
    await kafkaConsumer.initialize();
    await eventAggregator.initialize();
    await analyticsService.initialize();
    await auditService.initialize();

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

  describe('High Volume Event Processing', () => {
    test('should handle 1000 events efficiently', async () => {
      const eventCount = 1000;
      const startTime = Date.now();

      // Generate events
      const events = [];
      for (let i = 0; i < eventCount; i++) {
        events.push({
          eventType: eventTypes.PROJECT_CREATED,
          data: {
            projectId: `stress-project-${i}`,
            projectName: `Stress Test Project ${i}`,
            status: 'planning',
            progress: 0
          },
          metadata: {
            userId: 'stress-test-user',
            userRole: 'manager'
          }
        });
      }

      // Send events in batches
      const batchSize = 100;
      const batches = [];
      for (let i = 0; i < events.length; i += batchSize) {
        batches.push(events.slice(i, i + batchSize));
      }

      const sendPromises = batches.map(batch => 
        Promise.all(batch.map(event => 
          kafkaProducer.sendProjectEvent(event.eventType, event.data, event.metadata)
        ))
      );

      const results = await Promise.all(sendPromises);
      const sendTime = Date.now() - startTime;

      // Flatten results
      const allResults = results.flat();
      const successfulEvents = allResults.filter(r => r.success);
      
      expect(successfulEvents.length).toBe(eventCount);

      // Wait for events to be processed
      await waitForEvents(eventTypes.PROJECT_CREATED, eventCount, 30000);

      const totalTime = Date.now() - startTime;

      console.log(`\n📊 Stress Test Results:`);
      console.log(`   Events sent: ${eventCount}`);
      console.log(`   Send time: ${sendTime}ms`);
      console.log(`   Total time: ${totalTime}ms`);
      console.log(`   Send rate: ${(eventCount / sendTime * 1000).toFixed(2)} events/second`);
      console.log(`   Process rate: ${(eventCount / totalTime * 1000).toFixed(2)} events/second`);
      console.log(`   Success rate: ${(successfulEvents.length / eventCount * 100).toFixed(2)}%`);

      expect(totalTime).toBeLessThan(60000); // Should complete within 60 seconds
    });

    test('should handle mixed event types efficiently', async () => {
      const eventCount = 500;
      const startTime = Date.now();

      // Generate mixed events
      const events = [];
      const eventTypesList = [
        eventTypes.PROJECT_CREATED,
        eventTypes.TASK_CREATED,
        eventTypes.INCIDENT_REPORTED,
        eventTypes.PPE_ITEM_CREATED,
        eventTypes.USER_REGISTERED,
        eventTypes.NOTIFICATION_SENT
      ];

      for (let i = 0; i < eventCount; i++) {
        const eventType = eventTypesList[i % eventTypesList.length];
        events.push({
          eventType,
          data: {
            id: `stress-${eventType}-${i}`,
            name: `Stress Test ${eventType} ${i}`,
            status: 'active'
          },
          metadata: {
            userId: 'stress-test-user',
            userRole: 'manager'
          }
        });
      }

      // Send events
      const promises = events.map(event => {
        switch (event.eventType) {
          case eventTypes.PROJECT_CREATED:
            return kafkaProducer.sendProjectEvent(event.eventType, event.data, event.metadata);
          case eventTypes.TASK_CREATED:
            return kafkaProducer.sendTaskEvent(event.eventType, event.data, event.metadata);
          case eventTypes.INCIDENT_REPORTED:
            return kafkaProducer.sendIncidentEvent(event.eventType, event.data, event.metadata);
          case eventTypes.PPE_ITEM_CREATED:
            return kafkaProducer.sendPPEEvent(event.eventType, event.data, event.metadata);
          case eventTypes.USER_REGISTERED:
            return kafkaProducer.sendUserEvent(event.eventType, event.data, event.metadata);
          case eventTypes.NOTIFICATION_SENT:
            return kafkaProducer.sendNotificationEvent(event.eventType, event.data, event.metadata);
          default:
            return kafkaProducer.sendEvent('test-topic', event);
        }
      });

      const results = await Promise.all(promises);
      const sendTime = Date.now() - startTime;

      const successfulEvents = results.filter(r => r.success);
      expect(successfulEvents.length).toBe(eventCount);

      // Wait for events to be processed
      await waitForMixedEvents(events, 30000);

      const totalTime = Date.now() - startTime;

      console.log(`\n📊 Mixed Events Stress Test Results:`);
      console.log(`   Events sent: ${eventCount}`);
      console.log(`   Event types: ${eventTypesList.length}`);
      console.log(`   Send time: ${sendTime}ms`);
      console.log(`   Total time: ${totalTime}ms`);
      console.log(`   Send rate: ${(eventCount / sendTime * 1000).toFixed(2)} events/second`);
      console.log(`   Process rate: ${(eventCount / totalTime * 1000).toFixed(2)} events/second`);

      expect(totalTime).toBeLessThan(60000);
    });
  });

  describe('Concurrent Event Processing', () => {
    test('should handle concurrent events from multiple sources', async () => {
      const eventCount = 200;
      const concurrentSources = 5;
      const eventsPerSource = eventCount / concurrentSources;
      const startTime = Date.now();

      // Create concurrent event sources
      const sourcePromises = [];
      for (let source = 0; source < concurrentSources; source++) {
        const sourcePromise = (async () => {
          const events = [];
          for (let i = 0; i < eventsPerSource; i++) {
            events.push({
              eventType: eventTypes.PROJECT_CREATED,
              data: {
                projectId: `concurrent-project-${source}-${i}`,
                projectName: `Concurrent Project ${source}-${i}`,
                status: 'planning',
                progress: 0
              },
              metadata: {
                userId: `user-${source}`,
                userRole: 'manager'
              }
            });
          }

          // Send events for this source
          const promises = events.map(event => 
            kafkaProducer.sendProjectEvent(event.eventType, event.data, event.metadata)
          );

          return Promise.all(promises);
        })();

        sourcePromises.push(sourcePromise);
      }

      const results = await Promise.all(sourcePromises);
      const sendTime = Date.now() - startTime;

      // Flatten results
      const allResults = results.flat();
      const successfulEvents = allResults.filter(r => r.success);
      
      expect(successfulEvents.length).toBe(eventCount);

      // Wait for events to be processed
      await waitForEvents(eventTypes.PROJECT_CREATED, eventCount, 20000);

      const totalTime = Date.now() - startTime;

      console.log(`\n📊 Concurrent Processing Results:`);
      console.log(`   Events sent: ${eventCount}`);
      console.log(`   Concurrent sources: ${concurrentSources}`);
      console.log(`   Send time: ${sendTime}ms`);
      console.log(`   Total time: ${totalTime}ms`);
      console.log(`   Send rate: ${(eventCount / sendTime * 1000).toFixed(2)} events/second`);
      console.log(`   Process rate: ${(eventCount / totalTime * 1000).toFixed(2)} events/second`);

      expect(totalTime).toBeLessThan(30000);
    });
  });

  describe('Memory and Performance', () => {
    test('should maintain performance under memory pressure', async () => {
      const eventCount = 300;
      const startTime = Date.now();
      const initialMemory = process.memoryUsage();

      // Generate events with larger payloads
      const events = [];
      for (let i = 0; i < eventCount; i++) {
        events.push({
          eventType: eventTypes.PROJECT_CREATED,
          data: {
            projectId: `memory-project-${i}`,
            projectName: `Memory Test Project ${i}`,
            status: 'planning',
            progress: 0,
            description: 'A'.repeat(1000), // Large description
            metadata: {
              tags: Array.from({ length: 50 }, (_, j) => `tag-${j}`),
              attachments: Array.from({ length: 10 }, (_, j) => ({
                id: `attachment-${j}`,
                name: `file-${j}.pdf`,
                size: 1024 * 1024 // 1MB
              }))
            }
          },
          metadata: {
            userId: 'memory-test-user',
            userRole: 'manager'
          }
        });
      }

      // Send events
      const promises = events.map(event => 
        kafkaProducer.sendProjectEvent(event.eventType, event.data, event.metadata)
      );

      const results = await Promise.all(promises);
      const sendTime = Date.now() - startTime;

      const successfulEvents = results.filter(r => r.success);
      expect(successfulEvents.length).toBe(eventCount);

      // Wait for events to be processed
      await waitForEvents(eventTypes.PROJECT_CREATED, eventCount, 25000);

      const totalTime = Date.now() - startTime;
      const finalMemory = process.memoryUsage();

      console.log(`\n📊 Memory Pressure Test Results:`);
      console.log(`   Events sent: ${eventCount}`);
      console.log(`   Send time: ${sendTime}ms`);
      console.log(`   Total time: ${totalTime}ms`);
      console.log(`   Initial memory: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Final memory: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Memory increase: ${((finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024).toFixed(2)} MB`);

      expect(totalTime).toBeLessThan(30000);
      expect(finalMemory.heapUsed - initialMemory.heapUsed).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
    });
  });

  describe('Error Recovery', () => {
    test('should recover from intermittent failures', async () => {
      const eventCount = 100;
      const startTime = Date.now();

      // Generate events with some that will fail
      const events = [];
      for (let i = 0; i < eventCount; i++) {
        events.push({
          eventType: eventTypes.PROJECT_CREATED,
          data: {
            projectId: `recovery-project-${i}`,
            projectName: `Recovery Test Project ${i}`,
            status: 'planning',
            progress: 0
          },
          metadata: {
            userId: 'recovery-test-user',
            userRole: 'manager'
          }
        });
      }

      // Send events with some delays to simulate network issues
      const promises = events.map((event, index) => {
        const promise = kafkaProducer.sendProjectEvent(event.eventType, event.data, event.metadata);
        
        // Add random delays for some events
        if (index % 10 === 0) {
          return new Promise(resolve => {
            setTimeout(() => {
              promise.then(resolve).catch(resolve);
            }, Math.random() * 100);
          });
        }
        
        return promise;
      });

      const results = await Promise.all(promises);
      const sendTime = Date.now() - startTime;

      const successfulEvents = results.filter(r => r.success);
      const failedEvents = results.filter(r => !r.success);

      console.log(`\n📊 Error Recovery Test Results:`);
      console.log(`   Events sent: ${eventCount}`);
      console.log(`   Successful: ${successfulEvents.length}`);
      console.log(`   Failed: ${failedEvents.length}`);
      console.log(`   Success rate: ${(successfulEvents.length / eventCount * 100).toFixed(2)}%`);
      console.log(`   Send time: ${sendTime}ms`);

      // Wait for successful events to be processed
      await waitForEvents(eventTypes.PROJECT_CREATED, successfulEvents.length, 20000);

      const totalTime = Date.now() - startTime;

      expect(successfulEvents.length).toBeGreaterThan(eventCount * 0.9); // At least 90% success rate
      expect(totalTime).toBeLessThan(30000);
    });
  });

  describe('Analytics Performance', () => {
    test('should handle analytics processing under load', async () => {
      const eventCount = 200;
      const startTime = Date.now();

      // Generate events
      const events = [];
      for (let i = 0; i < eventCount; i++) {
        events.push({
          eventType: eventTypes.PROJECT_CREATED,
          data: {
            projectId: `analytics-project-${i}`,
            projectName: `Analytics Test Project ${i}`,
            status: 'planning',
            progress: 0
          },
          metadata: {
            userId: 'analytics-test-user',
            userRole: 'manager'
          }
        });
      }

      // Send events
      const promises = events.map(event => 
        kafkaProducer.sendProjectEvent(event.eventType, event.data, event.metadata)
      );

      const results = await Promise.all(promises);
      const sendTime = Date.now() - startTime;

      const successfulEvents = results.filter(r => r.success);
      expect(successfulEvents.length).toBe(eventCount);

      // Wait for events to be processed
      await waitForEvents(eventTypes.PROJECT_CREATED, eventCount, 20000);

      // Check analytics performance
      const analyticsStartTime = Date.now();
      const dashboardData = analyticsService.getDashboardData();
      const analyticsTime = Date.now() - analyticsStartTime;

      const totalTime = Date.now() - startTime;

      console.log(`\n📊 Analytics Performance Results:`);
      console.log(`   Events processed: ${eventCount}`);
      console.log(`   Send time: ${sendTime}ms`);
      console.log(`   Total time: ${totalTime}ms`);
      console.log(`   Analytics query time: ${analyticsTime}ms`);
      console.log(`   Projects in analytics: ${dashboardData.overview.projects.total}`);

      expect(analyticsTime).toBeLessThan(1000); // Analytics queries should be fast
      expect(totalTime).toBeLessThan(25000);
    });
  });

  describe('Audit Performance', () => {
    test('should handle audit logging under load', async () => {
      const eventCount = 150;
      const startTime = Date.now();

      // Generate events
      const events = [];
      for (let i = 0; i < eventCount; i++) {
        events.push({
          eventType: eventTypes.PROJECT_CREATED,
          data: {
            projectId: `audit-project-${i}`,
            projectName: `Audit Test Project ${i}`,
            status: 'planning',
            progress: 0
          },
          metadata: {
            userId: 'audit-test-user',
            userRole: 'manager'
          }
        });
      }

      // Send events
      const promises = events.map(event => 
        kafkaProducer.sendProjectEvent(event.eventType, event.data, event.metadata)
      );

      const results = await Promise.all(promises);
      const sendTime = Date.now() - startTime;

      const successfulEvents = results.filter(r => r.success);
      expect(successfulEvents.length).toBe(eventCount);

      // Wait for events to be processed
      await waitForEvents(eventTypes.PROJECT_CREATED, eventCount, 20000);

      // Check audit performance
      const auditStartTime = Date.now();
      const auditLogs = auditService.getAuditLogs({ limit: 100 });
      const auditTime = Date.now() - auditStartTime;

      const totalTime = Date.now() - startTime;

      console.log(`\n📊 Audit Performance Results:`);
      console.log(`   Events processed: ${eventCount}`);
      console.log(`   Send time: ${sendTime}ms`);
      console.log(`   Total time: ${totalTime}ms`);
      console.log(`   Audit query time: ${auditTime}ms`);
      console.log(`   Audit logs retrieved: ${auditLogs.logs.length}`);

      expect(auditTime).toBeLessThan(1000); // Audit queries should be fast
      expect(totalTime).toBeLessThan(25000);
    });
  });

  // Helper functions
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

  async function waitForMixedEvents(events, timeout = 10000) {
    const startTime = Date.now();
    const eventCounts = {};
    
    // Count expected events by type
    events.forEach(event => {
      eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
    });
    
    while (Date.now() - startTime < timeout) {
      const receivedCounts = {};
      receivedEvents.forEach(event => {
        receivedCounts[event.eventType] = (receivedCounts[event.eventType] || 0) + 1;
      });
      
      // Check if all event types have been received
      let allReceived = true;
      for (const [eventType, expectedCount] of Object.entries(eventCounts)) {
        if ((receivedCounts[eventType] || 0) < expectedCount) {
          allReceived = false;
          break;
        }
      }
      
      if (allReceived) {
        return receivedEvents;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Mixed events not all received within ${timeout}ms`);
  }
});
