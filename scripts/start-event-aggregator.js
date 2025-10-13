#!/usr/bin/env node

const eventAggregator = require('../services/eventAggregator');

async function startEventAggregator() {
    try {
        console.log('🔄 Starting Event Aggregator...');
        await eventAggregator.initialize();
        console.log('✅ Event Aggregator started successfully');
        
        // Keep the process running
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down Event Aggregator...');
            await eventAggregator.shutdown();
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            console.log('\n🛑 Shutting down Event Aggregator...');
            await eventAggregator.shutdown();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Failed to start Event Aggregator:', error);
        process.exit(1);
    }
}

startEventAggregator();
