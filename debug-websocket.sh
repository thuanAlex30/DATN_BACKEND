#!/bin/bash

# WebSocket Debug Script
# This script helps debug WebSocket connection issues

echo "🔍 WebSocket Debug Script"
echo "========================="

# Check if server is running
echo "1. Checking if server is running..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Server is running on port 3000"
else
    echo "❌ Server is not running on port 3000"
    echo "   Please start the server first: npm run dev"
    exit 1
fi

# Check Socket.IO endpoint
echo ""
echo "2. Testing Socket.IO endpoint..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3000/socket.io/

# Test CORS preflight
echo ""
echo "3. Testing CORS preflight..."
curl -X OPTIONS \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization" \
  -v http://localhost:3000/socket.io/ 2>&1 | grep -E "(< HTTP|< Access-Control)"

# Test Socket.IO handshake
echo ""
echo "4. Testing Socket.IO handshake..."
curl -H "Origin: http://localhost:5173" \
  -v "http://localhost:3000/socket.io/?EIO=4&transport=polling" 2>&1 | head -20

# Check network connectivity
echo ""
echo "5. Checking network connectivity..."
netstat -an | grep :3000 | head -5

# Check for port conflicts
echo ""
echo "6. Checking for port conflicts..."
lsof -i :3000 2>/dev/null || echo "No processes found on port 3000"

echo ""
echo "🔍 Debug completed. Check the output above for issues."
echo ""
echo "Next steps:"
echo "1. If CORS errors: Check server CORS configuration"
echo "2. If connection refused: Check if server is running"
echo "3. If handshake fails: Check Socket.IO version compatibility"
echo "4. Run: node test-websocket.js for detailed testing"
