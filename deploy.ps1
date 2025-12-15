# Spotless Solution - Deployment Script
Write-Host "🚀 Spotless Solution Deployment" -ForegroundColor Cyan
Write-Host "================================"

# Check Node.js version
$nodeVersion = node --version
Write-Host "Node.js Version: $nodeVersion" -ForegroundColor Green

# Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Create data directory
Write-Host "`n🗄️  Setting up data directory..." -ForegroundColor Yellow
if (!(Test-Path "data")) {
    New-Item -ItemType Directory -Path "data" -Force
    Write-Host "Created data directory" -ForegroundColor Green
}

# Create backups directory
if (!(Test-Path "backups")) {
    New-Item -ItemType Directory -Path "backups" -Force
    Write-Host "Created backups directory" -ForegroundColor Green
}

# Check if database exists, if not create sample data
if (!(Test-Path "data/spotless.db")) {
    Write-Host "`n📊 Creating sample database..." -ForegroundColor Yellow
    node src/init-sample-data.js
    Write-Host "Sample database created" -ForegroundColor Green
}

# Create log directory
if (!(Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" -Force
    Write-Host "Created logs directory" -ForegroundColor Green
}

# Set up environment
Write-Host "`n⚙️  Setting up environment..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
    Write-Host "Created .env file (please configure it)" -ForegroundColor Yellow
}

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env file with your configuration" -ForegroundColor White
Write-Host "2. Run: node src/app.js" -ForegroundColor White
Write-Host "3. Visit: http://localhost:3000" -ForegroundColor White
Write-Host "`n🔄 For production:" -ForegroundColor Magenta
Write-Host "   pm2 start ecosystem.config.js --env production" -ForegroundColor White
