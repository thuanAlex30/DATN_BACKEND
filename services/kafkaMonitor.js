// If Kafka disabled, export a simple stub that tracks nothing
if (process.env.KAFKA_ENABLED === 'false' || process.env.KAFKA_ENABLED === '0') {
  console.log('ℹ️ KafkaMonitor stub active (KAFKA_ENABLED=false)');
  module.exports = {
    startMonitoring: async () => {},
    stopMonitoring: () => {},
    incrementProducerMetrics: () => {},
    incrementConsumerMetrics: () => {},
    setProducerError: () => {},
    setConsumerError: () => {},
    getMetrics: () => ({ producer: {}, consumer: {}, topics: {}, dlq: {} })
  };
  return;
}

const { kafka, topics } = require('../config/kafkaConfig');

class KafkaMonitor {
  constructor() {
    this.metrics = {
      producer: {
        messagesSent: 0,
        errors: 0,
        lastError: null,
        averageLatency: 0,
        isConnected: false
      },
      consumer: {
        messagesProcessed: 0,
        errors: 0,
        lastError: null,
        consumerLag: 0,
        isConnected: false
      },
      topics: {},
      dlq: {
        messagesInDLQ: 0,
        lastDLQMessage: null
      }
    };
    
    this.isMonitoring = false;
    this.monitoringInterval = null;
  }

  /**
   * Start monitoring Kafka health
   */
  async startMonitoring() {
    if (this.isMonitoring) {
      console.log('📊 Kafka monitoring already started');
      return;
    }

    // Respect runtime flag to skip Kafka monitoring entirely
    if (process.env.KAFKA_ENABLED === 'false' || process.env.KAFKA_ENABLED === '0') {
      console.log('ℹ️ Kafka monitoring skipped because KAFKA_ENABLED is false');
      return;
    }

    console.log('📊 Starting Kafka monitoring...');
    this.isMonitoring = true;

    // Monitor every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics();
      await this.checkHealth();
    }, 30000);

    // Initial health check
    await this.collectMetrics();
    await this.checkHealth();

    console.log('✅ Kafka monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('📊 Kafka monitoring stopped');
  }

  /**
   * Collect metrics from Kafka
   */
  async collectMetrics() {
    try {
      // Dynamic require to avoid circular dependency
      let kafkaProducer, kafkaConsumer;
      try {
        kafkaProducer = require('./kafkaProducer');
        kafkaConsumer = require('./kafkaConsumer');
      } catch (error) {
        console.warn('⚠️ Could not load Kafka services for metrics:', error.message);
        return;
      }

      // Producer metrics
      const producerStatus = kafkaProducer.getStatus();
      this.metrics.producer.isConnected = producerStatus.isConnected;

      // Consumer metrics
      const consumerStatus = kafkaConsumer.getStatus();
      this.metrics.consumer.isConnected = consumerStatus.isConnected;

      // Topic metrics
      await this.collectTopicMetrics();

      // DLQ metrics
      await this.collectDLQMetrics();

    } catch (error) {
      console.error('❌ Error collecting Kafka metrics:', error);
    }
  }

  /**
   * Collect topic-specific metrics
   */
  async collectTopicMetrics() {
    let admin = null;
    try {
      admin = kafka.admin();
      await admin.connect();

      const topicList = Object.values(topics);
      
      // Check if topics exist before fetching metadata
      const existingTopics = await admin.listTopics();
      const availableTopics = topicList.filter(topic => existingTopics.includes(topic));
      
      if (availableTopics.length === 0) {
        // Topics don't exist yet, initialize with default values
        for (const topic of topicList) {
          if (!this.metrics.topics[topic]) {
            this.metrics.topics[topic] = {
              partitions: 0,
              replicationFactor: 0,
              messagesPerSecond: 0,
              lastMessageTime: null
            };
          }
        }
        await admin.disconnect();
        return; // Exit early if no topics exist
      }

      // Retry logic for leadership election errors
      let topicMetadata = null;
      let retries = 3;
      let retryDelay = 1000;
      
      while (retries > 0) {
        try {
          const metadata = await admin.describeCluster();
          topicMetadata = await admin.fetchTopicMetadata({ topics: availableTopics });
          break; // Success, exit retry loop
        } catch (error) {
          const isLeadershipElection = error.message?.includes('leadership election') || 
                                       error.message?.includes('no leader');
          const isUnknownTopic = error.type === 'UNKNOWN_TOPIC_OR_PARTITION' || 
                                error.code === 3;
          
          if ((isLeadershipElection || isUnknownTopic) && retries > 1) {
            retries--;
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            retryDelay *= 2; // Exponential backoff
            continue;
          }
          throw error; // Re-throw if not retryable or out of retries
        }
      }

      if (!topicMetadata) {
        await admin.disconnect();
        return;
      }

      for (const topic of availableTopics) {
        if (!this.metrics.topics[topic]) {
          this.metrics.topics[topic] = {
            partitions: 0,
            replicationFactor: 0,
            messagesPerSecond: 0,
            lastMessageTime: null
          };
        }

        const topicInfo = topicMetadata.topics.find(t => t.name === topic);
        if (topicInfo && topicInfo.partitions && topicInfo.partitions.length > 0) {
          this.metrics.topics[topic].partitions = topicInfo.partitions.length;
          this.metrics.topics[topic].replicationFactor = topicInfo.partitions[0]?.replicas?.length || 0;
        }
      }

      await admin.disconnect();
    } catch (error) {
      // Handle specific Kafka errors gracefully
      const isLeadershipElection = error.message?.includes('leadership election') || 
                                   error.message?.includes('no leader');
      const isUnknownTopic = error.type === 'UNKNOWN_TOPIC_OR_PARTITION' || 
                            error.code === 3;
      
      if (isLeadershipElection || isUnknownTopic) {
        // These are expected during Kafka startup, log as warning instead of error
        console.warn(`⚠️ Kafka topic metrics temporarily unavailable (Kafka initializing): ${error.message}`);
      } else {
        console.error('❌ Error collecting topic metrics:', error);
      }
      
      // Ensure admin is disconnected even on error
      if (admin) {
        try {
          await admin.disconnect();
        } catch (disconnectError) {
          // Ignore disconnect errors
        }
      }
    }
  }

  /**
   * Collect DLQ metrics
   */
  async collectDLQMetrics() {
    try {
      const admin = kafka.admin();
      await admin.connect();

      const dlqTopics = Object.values(topics).map(topic => `${topic}.dlq`);
      
      // Check if DLQ topics exist before trying to fetch metadata
      const allTopics = await admin.listTopics();
      const existingDLQTopics = dlqTopics.filter(topic => allTopics.includes(topic));
      
      if (existingDLQTopics.length === 0) {
        // No DLQ topics exist, skip collection
        this.metrics.dlq.messagesInDLQ = 0;
        await admin.disconnect();
        return;
      }

      const topicMetadata = await admin.fetchTopicMetadata({ topics: existingDLQTopics });

      let totalDLQMessages = 0;
      for (const topic of existingDLQTopics) {
        const topicInfo = topicMetadata.topics.find(t => t.name === topic);
        if (topicInfo) {
          // Get partition offsets
          const offsets = await admin.fetchTopicOffsets(topic);
          for (const partition of offsets) {
            totalDLQMessages += parseInt(partition.offset) || 0;
          }
        }
      }

      this.metrics.dlq.messagesInDLQ = totalDLQMessages;
      await admin.disconnect();
    } catch (error) {
      // Silently skip DLQ metrics if topics don't exist
      this.metrics.dlq.messagesInDLQ = 0;
    }
  }

  /**
   * Check Kafka health and send alerts
   */
  async checkHealth() {
    const healthStatus = {
      overall: 'healthy',
      issues: [],
      timestamp: new Date().toISOString()
    };

    // Check producer health
    if (!this.metrics.producer.isConnected) {
      healthStatus.issues.push('Producer not connected');
      healthStatus.overall = 'unhealthy';
    }

    // Check consumer health
    if (!this.metrics.consumer.isConnected) {
      healthStatus.issues.push('Consumer not connected');
      healthStatus.overall = 'unhealthy';
    }

    // Check DLQ messages
    if (this.metrics.dlq.messagesInDLQ > 10) {
      healthStatus.issues.push(`High DLQ messages: ${this.metrics.dlq.messagesInDLQ}`);
      healthStatus.overall = 'warning';
    }

    // Check error rates
    const producerErrorRate = this.metrics.producer.errors / Math.max(this.metrics.producer.messagesSent, 1);
    if (producerErrorRate > 0.1) { // 10% error rate
      healthStatus.issues.push(`High producer error rate: ${(producerErrorRate * 100).toFixed(2)}%`);
      healthStatus.overall = 'warning';
    }

    const consumerErrorRate = this.metrics.consumer.errors / Math.max(this.metrics.consumer.messagesProcessed, 1);
    if (consumerErrorRate > 0.1) { // 10% error rate
      healthStatus.issues.push(`High consumer error rate: ${(consumerErrorRate * 100).toFixed(2)}%`);
      healthStatus.overall = 'warning';
    }

    // Send health check event
    await this.sendHealthCheckEvent(healthStatus);

    // Log health status
    if (healthStatus.overall !== 'healthy') {
      console.warn(`⚠️ Kafka health check: ${healthStatus.overall}`, healthStatus.issues);
    } else {
      console.log('✅ Kafka health check: healthy');
    }

    return healthStatus;
  }

  /**
   * Send health check event to system events topic
   */
  async sendHealthCheckEvent(healthStatus) {
    try {
      // Dynamic require to avoid circular dependency
      let kafkaProducer;
      try {
        kafkaProducer = require('./kafkaProducer');
      } catch (error) {
        console.warn('⚠️ Could not load Kafka producer for health check:', error.message);
        return;
      }

      await kafkaProducer.sendSystemEvent('system_health_check', {
        systemId: 'kafka-monitor',
        component: 'kafka',
        level: healthStatus.overall === 'healthy' ? 'info' : 'warning',
        message: `Kafka health check: ${healthStatus.overall}`,
        details: {
          metrics: this.metrics,
          healthStatus
        }
      });
    } catch (error) {
      console.error('❌ Failed to send health check event:', error);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      isMonitoring: this.isMonitoring,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Increment producer metrics
   */
  incrementProducerMetrics(success = true, latency = 0) {
    if (success) {
      this.metrics.producer.messagesSent++;
      // Update average latency
      const totalMessages = this.metrics.producer.messagesSent;
      this.metrics.producer.averageLatency = 
        (this.metrics.producer.averageLatency * (totalMessages - 1) + latency) / totalMessages;
    } else {
      this.metrics.producer.errors++;
    }
  }

  /**
   * Increment consumer metrics
   */
  incrementConsumerMetrics(success = true) {
    if (success) {
      this.metrics.consumer.messagesProcessed++;
    } else {
      this.metrics.consumer.errors++;
    }
  }

  /**
   * Set producer error
   */
  setProducerError(error) {
    this.metrics.producer.lastError = {
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Set consumer error
   */
  setConsumerError(error) {
    this.metrics.consumer.lastError = {
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const kafkaMonitor = new KafkaMonitor();

module.exports = kafkaMonitor;
