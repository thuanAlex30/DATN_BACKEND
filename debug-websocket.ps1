# WebSocket Debug Script for Windows
# This script helps debug WebSocket connection issues

Write-Host "🔍 WebSocket Debug Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# Check if server is running
Write-Host "1. Checking if server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Server is running on port 3000" -ForegroundColor Green
} catch {
    Write-Host "❌ Server is not running on port 3000" -ForegroundColor Red
    Write-Host "   Please start the server first: npm run dev" -ForegroundColor Yellow
    exit 1
}

# Check Socket.IO endpoint
Write-Host ""
Write-Host "2. Testing Socket.IO endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/socket.io/" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Socket.IO endpoint accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ Socket.IO endpoint not accessible" -ForegroundColor Red
}

# Test CORS preflight
Write-Host ""
Write-Host "3. Testing CORS preflight..." -ForegroundColor Yellow
try {
    $headers = @{
        "Origin" = "http://localhost:5173"
        "Access-Control-Request-Method" = "GET"
        "Access-Control-Request-Headers" = "authorization"
    }
    $response = Invoke-WebRequest -Uri "http://localhost:3000/socket.io/" -Method OPTIONS -Headers $headers -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ CORS preflight successful" -ForegroundColor Green
    Write-Host "   Access-Control-Allow-Origin: $($response.Headers['Access-Control-Allow-Origin'])" -ForegroundColor Gray
} catch {
    Write-Host "❌ CORS preflight failed" -ForegroundColor Red
}

# Test Socket.IO handshake
Write-Host ""
Write-Host "4. Testing Socket.IO handshake..." -ForegroundColor Yellow
try {
    $headers = @{
        "Origin" = "http://localhost:5173"
    }
    $response = Invoke-WebRequest -Uri "http://localhost:3000/socket.io/?EIO=4&transport=polling" -Headers $headers -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Socket.IO handshake successful" -ForegroundColor Green
    Write-Host "   Response length: $($response.Content.Length) bytes" -ForegroundColor Gray
} catch {
    Write-Host "❌ Socket.IO handshake failed" -ForegroundColor Red
}

# Check network connectivity
Write-Host ""
Write-Host "5. Checking network connectivity..." -ForegroundColor Yellow
$connections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($connections) {
    Write-Host "✅ Port 3000 is listening" -ForegroundColor Green
    foreach ($conn in $connections) {
        Write-Host "   State: $($conn.State), LocalAddress: $($conn.LocalAddress)" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Port 3000 is not listening" -ForegroundColor Red
}

# Check for port conflicts
Write-Host ""
Write-Host "6. Checking for port conflicts..." -ForegroundColor Yellow
$processes = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($processes) {
    Write-Host "✅ Node.js processes found:" -ForegroundColor Green
    foreach ($proc in $processes) {
        Write-Host "   PID: $($proc.Id), Name: $($proc.ProcessName)" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ No Node.js processes found" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔍 Debug completed. Check the output above for issues." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. If CORS errors: Check server CORS configuration" -ForegroundColor White
Write-Host "2. If connection refused: Check if server is running" -ForegroundColor White
Write-Host "3. If handshake fails: Check Socket.IO version compatibility" -ForegroundColor White
Write-Host "4. Run: node test-websocket.js for detailed testing" -ForegroundColor White
