# Lists exportable function names from lib/index.js
$indexPath = Join-Path $PSScriptRoot '..\lib\index.js' | Resolve-Path
if (-not (Test-Path $indexPath)) {
  Write-Host "🔧 Building functions (index.js not found)..." -ForegroundColor Yellow
  Push-Location (Join-Path $PSScriptRoot '..')
  npm run build | Write-Host
  Pop-Location
}

$exports = Select-String -Pattern '^export\s+\{\s*([^}]+)\s*\}' -Path $indexPath -AllMatches | ForEach-Object { $_.Matches } | ForEach-Object { $_.Groups[1].Value }
$names = @()
foreach ($line in $exports) {
  $parts = $line -split ',' | ForEach-Object { $_.Trim() }
  foreach ($p in $parts) {
    if ($p -match 'as\s+(\w+)$') { $names += $Matches[1] }
    else { $names += ($p -split '\s+')[0] }
  }
}
$names = $names | Sort-Object -Unique

Write-Host "📋 Exported Firebase Functions:" -ForegroundColor Green
$names | ForEach-Object { Write-Host " - $_" }