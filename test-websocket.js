#!/usr/bin/env node

/**
 * WebSocket Connection Test Script
 * Tests Socket.IO connection with various scenarios
 */

const { io } = require('socket.io-client');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const TEST_TOKEN = process.env.TEST_TOKEN || 'your_test_jwt_token_here';

console.log('🧪 Starting WebSocket Connection Tests...');
console.log(`📍 Server URL: ${SERVER_URL}`);
console.log(`🔑 Test Token: ${TEST_TOKEN ? 'Provided' : 'Missing'}`);

// Test 1: Basic connection without auth
console.log('\n🔍 Test 1: Basic connection without authentication');
const socket1 = io(SERVER_URL, {
  transports: ['websocket', 'polling'],
  timeout: 5000
});

socket1.on('connect', () => {
  console.log('✅ Test 1: Connected successfully');
  socket1.disconnect();
});

socket1.on('connect_error', (error) => {
  console.log('❌ Test 1: Connection failed:', error.message);
});

socket1.on('disconnect', (reason) => {
  console.log('🔌 Test 1: Disconnected:', reason);
});

// Test 2: Connection with auth token
setTimeout(() => {
  console.log('\n🔍 Test 2: Connection with authentication token');
  const socket2 = io(SERVER_URL, {
    auth: {
      token: TEST_TOKEN
    },
    transports: ['websocket', 'polling'],
    timeout: 5000
  });

  socket2.on('connect', () => {
    console.log('✅ Test 2: Connected with auth successfully');
    console.log('🔌 Socket ID:', socket2.id);
    console.log('🔌 Transport:', socket2.io.engine.transport.name);
  });

  socket2.on('authenticated', (data) => {
    console.log('✅ Test 2: Authentication successful:', data);
  });

  socket2.on('authentication_error', (error) => {
    console.log('❌ Test 2: Authentication failed:', error);
  });

  socket2.on('connect_error', (error) => {
    console.log('❌ Test 2: Connection failed:', error.message);
    console.log('❌ Error details:', {
      message: error.message,
      description: error.description,
      context: error.context,
      type: error.type
    });
  });

  socket2.on('disconnect', (reason) => {
    console.log('🔌 Test 2: Disconnected:', reason);
  });

  // Test 3: Send test event
  setTimeout(() => {
    if (socket2.connected) {
      console.log('\n🔍 Test 3: Sending test event');
      socket2.emit('ppe_status_update', {
        itemId: 'test-item-123',
        status: 'test',
        timestamp: new Date()
      });
      
      setTimeout(() => {
        socket2.disconnect();
        console.log('\n✅ All tests completed');
        process.exit(0);
      }, 2000);
    }
  }, 2000);

}, 3000);

// Test 4: CORS test with curl
setTimeout(() => {
  console.log('\n🔍 Test 4: CORS Test Commands');
  console.log('Run these commands in separate terminals:');
  console.log('');
  console.log('# Test CORS preflight:');
  console.log(`curl -X OPTIONS -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: authorization" -v ${SERVER_URL}/socket.io/`);
  console.log('');
  console.log('# Test Socket.IO handshake:');
  console.log(`curl -H "Origin: http://localhost:5173" -v "${SERVER_URL}/socket.io/?EIO=4&transport=polling"`);
  console.log('');
}, 1000);
