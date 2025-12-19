#!/usr/bin/env node

const auditService = require('../services/auditService');

async function startAuditService() {
    try {
        console.log('🔍 Starting Audit Service...');
        await auditService.initialize();
        console.log('✅ Audit Service started successfully');
        
        // Keep the process running
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down Audit Service...');
            await auditService.shutdown();
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            console.log('\n🛑 Shutting down Audit Service...');
            await auditService.shutdown();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Failed to start Audit Service:', error);
        process.exit(1);
    }
}

startAuditService();
