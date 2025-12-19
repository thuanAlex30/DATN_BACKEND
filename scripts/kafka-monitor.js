const { Kafka } = require('kafkajs');

// Kafka configuration
const kafka = new Kafka({
  clientId: 'kafka-monitor',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092']
});

const admin = kafka.admin();
const consumer = kafka.consumer({ groupId: 'monitor-group' });

// Topics to monitor
const topics = [
  'project-events',
  'task-events',
  'incident-events',
  'ppe-events',
  'user-events',
  'notification-events',
  'system-events'
];

// Statistics
const stats = {
  totalMessages: 0,
  messagesByTopic: {},
  messagesByEventType: {},
  startTime: Date.now()
};

async function monitorTopics() {
  try {
    console.log('🔌 Connecting to Kafka...');
    await admin.connect();
    
    console.log('📋 Listing topics...');
    const topicList = await admin.listTopics();
    console.log('Available topics:', topicList);
    
    // Get topic details
    console.log('📊 Topic details:');
    const topicDetails = await admin.describeTopics(topicList);
    
    for (const [topicName, details] of Object.entries(topicDetails)) {
      console.log(`\n📌 Topic: ${topicName}`);
      console.log(`   Partitions: ${details.partitions.length}`);
      console.log(`   Replication Factor: ${details.partitions[0]?.replicas?.length || 0}`);
      
      // Get partition details
      for (const partition of details.partitions) {
        console.log(`   Partition ${partition.partitionId}:`);
        console.log(`     Leader: ${partition.leader}`);
        console.log(`     Replicas: ${partition.replicas.join(', ')}`);
        console.log(`     ISR: ${partition.isr.join(', ')}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error monitoring topics:', error);
  } finally {
    await admin.disconnect();
  }
}

async function monitorMessages() {
  try {
    console.log('🔌 Connecting to Kafka consumer...');
    await consumer.connect();
    
    console.log('📥 Subscribing to topics...');
    await consumer.subscribe({ 
      topics: topics,
      fromBeginning: false 
    });
    
    console.log('👂 Listening for messages...');
    console.log('Press Ctrl+C to stop monitoring\n');
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const eventData = JSON.parse(message.value.toString());
          
          // Update statistics
          stats.totalMessages++;
          stats.messagesByTopic[topic] = (stats.messagesByTopic[topic] || 0) + 1;
          stats.messagesByEventType[eventData.eventType] = (stats.messagesByEventType[eventData.eventType] || 0) + 1;
          
          // Log message
          console.log(`📨 [${new Date().toISOString()}] Topic: ${topic}, Partition: ${partition}, Offset: ${message.offset}`);
          console.log(`   Event Type: ${eventData.eventType}`);
          console.log(`   Event ID: ${eventData.eventId}`);
          console.log(`   Source: ${eventData.source}`);
          console.log(`   Timestamp: ${eventData.timestamp}`);
          
          if (eventData.data) {
            console.log(`   Data Keys: ${Object.keys(eventData.data).join(', ')}`);
          }
          
          if (eventData.metadata) {
            console.log(`   User ID: ${eventData.metadata.userId}`);
            console.log(`   User Role: ${eventData.metadata.userRole}`);
          }
          
          console.log('   ---');
          
        } catch (error) {
          console.error('❌ Error processing message:', error);
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error monitoring messages:', error);
  }
}

async function showStats() {
  const runtime = Date.now() - stats.startTime;
  const runtimeMinutes = Math.floor(runtime / 60000);
  const runtimeSeconds = Math.floor((runtime % 60000) / 1000);
  
  console.log('\n📊 Monitoring Statistics:');
  console.log(`   Runtime: ${runtimeMinutes}m ${runtimeSeconds}s`);
  console.log(`   Total Messages: ${stats.totalMessages}`);
  console.log(`   Messages per minute: ${Math.round(stats.totalMessages / (runtime / 60000))}`);
  
  console.log('\n📋 Messages by Topic:');
  for (const [topic, count] of Object.entries(stats.messagesByTopic)) {
    console.log(`   ${topic}: ${count}`);
  }
  
  console.log('\n📋 Messages by Event Type:');
  for (const [eventType, count] of Object.entries(stats.messagesByEventType)) {
    console.log(`   ${eventType}: ${count}`);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down monitor...');
  await showStats();
  await consumer.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down monitor...');
  await showStats();
  await consumer.disconnect();
  process.exit(0);
});

// Main function
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'topics':
      await monitorTopics();
      break;
    case 'messages':
      await monitorMessages();
      break;
    default:
      console.log('Usage: node kafka-monitor.js [topics|messages]');
      console.log('  topics   - Show topic information');
      console.log('  messages - Monitor messages in real-time');
      process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { monitorTopics, monitorMessages, showStats };
