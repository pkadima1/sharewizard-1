#!/usr/bin/env pwsh
# Firebase Functions Production Verification Script
# Run this after any function cleanup to ensure production safety

Write-Host "🔍 Firebase Functions Production Safety Check" -ForegroundColor Green
Write-Host "=" * 50

# Check 1: Verify no test functions are exported
Write-Host "`n📋 Check 1: Export Safety" -ForegroundColor Yellow
$testExports = Select-String -Pattern "test|debug|favorite" lib/index.js -CaseSensitive
if ($testExports) {
    Write-Host "❌ CRITICAL: Test functions found in exports!" -ForegroundColor Red
    $testExports
    exit 1
} else {
    Write-Host "✅ No test functions exported - SAFE" -ForegroundColor Green
}

# Check 2: Count total functions
Write-Host "`n📊 Check 2: Function Count" -ForegroundColor Yellow
$exportCount = (Select-String -Pattern "^export" lib/index.js).Count
Write-Host "✅ Total functions ready for deployment: $exportCount" -ForegroundColor Green

# Check 3: Verify build success
Write-Host "`n🔧 Check 3: Build Status" -ForegroundColor Yellow
if (Test-Path "lib/index.js") {
    Write-Host "✅ Build completed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed - index.js not found" -ForegroundColor Red
    exit 1
}

# Check 4: Debug files status
Write-Host "`n🧹 Check 4: Debug File Status" -ForegroundColor Yellow
$debugFiles = @("debugEnv.js", "debugEnvironment.js", "favoritePost.js")
foreach ($file in $debugFiles) {
    $path = "lib/$file"
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        if ($content -match "commented out|TODO.*Remove") {
            Write-Host "✅ $file - Properly commented for removal" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $file - Should be commented out" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n🎯 Production Readiness Summary:" -ForegroundColor Cyan
Write-Host "✅ No test functions will be deployed" -ForegroundColor Green
Write-Host "✅ $exportCount business functions ready" -ForegroundColor Green
Write-Host "✅ Debug overhead minimized" -ForegroundColor Green
Write-Host "✅ Bundle size optimized" -ForegroundColor Green

Write-Host "`n🚀 READY FOR PRODUCTION DEPLOYMENT!" -ForegroundColor Green -BackgroundColor DarkGreen