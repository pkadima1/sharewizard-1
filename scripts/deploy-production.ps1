# 🚀 Production Deployment Script for ShareWizard (Windows)
# Enhanced Error Recovery System Deployment

Write-Host "🚀 Starting Production Deployment..." -ForegroundColor Green

# Step 1: Navigate to functions directory
Write-Host "📁 Navigating to functions directory..." -ForegroundColor Yellow
Set-Location functions

# Step 2: Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Step 3: Build the project
Write-Host "🔨 Building project..." -ForegroundColor Yellow
npm run build

# Check if build was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed! Aborting deployment." -ForegroundColor Red
    exit 1
}

# Step 4: Run linting
Write-Host "🔍 Running linting..." -ForegroundColor Yellow
npm run lint

# Step 5: Deploy to production
Write-Host "🚀 Deploying to production..." -ForegroundColor Yellow
npm run deploy

# Check if deployment was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Enhanced Error Recovery System deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Expected Improvements:" -ForegroundColor Cyan
    Write-Host "   • Generation time: Reduced from 92s to ~60s" -ForegroundColor White
    Write-Host "   • Retry attempts: Reduced from 6 to 2 maximum" -ForegroundColor White
    Write-Host "   • Error recovery: Immediate fallback on API overload" -ForegroundColor White
    Write-Host "   • French localization: Complete error message support" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 Monitor logs with: firebase functions:log" -ForegroundColor Yellow
    Write-Host "📈 Check performance metrics in Firebase Console" -ForegroundColor Yellow
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
} 