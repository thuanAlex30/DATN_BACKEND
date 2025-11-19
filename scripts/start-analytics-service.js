#!/usr/bin/env node

const analyticsService = require('../services/analyticsService');

async function startAnalyticsService() {
    try {
        console.log('📊 Starting Analytics Service...');
        await analyticsService.initialize();
        console.log('✅ Analytics Service started successfully');
        
        // Keep the process running
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down Analytics Service...');
            await analyticsService.shutdown();
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            console.log('\n🛑 Shutting down Analytics Service...');
            await analyticsService.shutdown();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Failed to start Analytics Service:', error);
        process.exit(1);
    }
}

startAnalyticsService();
