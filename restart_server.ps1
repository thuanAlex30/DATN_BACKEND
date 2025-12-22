# PowerShell script to restart the backend server with new timeout configurations
Write-Host "🔄 Restarting backend server with optimized timeout configurations..." -ForegroundColor Green

# Kill existing Node.js processes
Write-Host "🛑 Stopping existing server processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*server.js*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "nodemon" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait a moment for processes to stop
Start-Sleep -Seconds 2

# Navigate to backend directory
Set-Location DATN_BACKEND

# Install any new dependencies if needed
Write-Host "📦 Checking dependencies..." -ForegroundColor Blue
npm install

# Start the server
Write-Host "🚀 Starting server with optimized configurations..." -ForegroundColor Green
Write-Host "   - Database timeout: 30s" -ForegroundColor Cyan
Write-Host "   - Server timeout: 2 minutes" -ForegroundColor Cyan
Write-Host "   - API endpoint timeouts: 15-25s" -ForegroundColor Cyan
Write-Host "   - Frontend timeout: 60s" -ForegroundColor Cyan

# Use nodemon for development or node for production
if ($env:NODE_ENV -eq "production") {
    node server.js
} else {
    nodemon server.js
}
