param(
  [Parameter(Mandatory=$true)][string[]]$Functions,
  [switch]$SkipBuild,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

Write-Host "🚀 Targeted Firebase Functions Deployment" -ForegroundColor Green
Write-Host ("=" * 50)

# Ensure we're in the functions directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$functionsRoot = Resolve-Path (Join-Path $scriptDir "..")
Set-Location $functionsRoot

# Validate function names from compiled exports
$indexPath = Join-Path $functionsRoot 'lib/index.js'
if (-not (Test-Path $indexPath)) {
  Write-Host "🔧 Building (index.js not found)..." -ForegroundColor Yellow
  npm run build | Write-Host
}

$exportLines = Select-String -Pattern '^export\s+\{\s*([^}]+)\s*\}' -Path $indexPath -AllMatches | ForEach-Object { $_.Matches } | ForEach-Object { $_.Groups[1].Value }
$allExports = @()
foreach ($line in $exportLines) {
  $parts = $line -split ',' | ForEach-Object { $_.Trim() }
  foreach ($p in $parts) {
    # Handle alias 'as'
    if ($p -match 'as\s+(\w+)$') {
      $name = $Matches[1]
    } else {
      $name = ($p -split '\s+')[0]
    }
    if ($name) { $allExports += $name }
  }
}
$allExports = $allExports | Sort-Object -Unique

# Validate provided functions exist
$invalid = @()
$valid = @()
foreach ($fn in $Functions) {
  if ($allExports -contains $fn) { $valid += $fn } else { $invalid += $fn }
}

if ($invalid.Count -gt 0) {
  Write-Host "❌ These functions are not found in compiled exports:" -ForegroundColor Red
  $invalid | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
  Write-Host "ℹ️ Available functions:" -ForegroundColor Yellow
  $allExports | ForEach-Object { Write-Host "  - $_" }
  exit 1
}

if (-not $SkipBuild) {
  Write-Host "🔧 Building functions (tsc)..." -ForegroundColor Yellow
  npm run build | Write-Host
}

$onlyArg = ($valid | ForEach-Object { "functions:$_" }) -join ','
$cmd = "firebase deploy --only $onlyArg"

if ($DryRun) {
  Write-Host "📝 DRY RUN - Command that would be executed:" -ForegroundColor Yellow
  Write-Host "  $cmd"
  exit 0
}

Write-Host "🚀 Deploying: $onlyArg" -ForegroundColor Cyan
$process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", $cmd -NoNewWindow -PassThru -Wait

if ($process.ExitCode -eq 0) {
  Write-Host "✅ Deployment successful for: $onlyArg" -ForegroundColor Green
  exit 0
} else {
  Write-Host "❌ Deployment failed for: $onlyArg (exit $($process.ExitCode))" -ForegroundColor Red
  exit $process.ExitCode
}
