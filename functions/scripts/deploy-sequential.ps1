param(
  [Parameter(Mandatory=$true)][string[]]$Functions,
  [int]$MaxRetries = 3,
  [int]$DelaySeconds = 8,
  [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'

# Plain ASCII output to avoid encoding issues in some terminals
Write-Host "Sequential Firebase Functions Deploy" -ForegroundColor Green
Write-Host ("=" * 50)
Write-Host "Project:" -ForegroundColor Yellow
firebase use | Write-Host

# Ensure working in functions folder
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$functionsRoot = Resolve-Path (Join-Path $scriptDir "..")
Set-Location $functionsRoot

if (-not $SkipBuild) {
  Write-Host "Building (tsc) before deployment..." -ForegroundColor Yellow
  npm run build | Write-Host
}

$deployOne = {
  param($fnName)
  $onlyArg = "functions:$fnName"
  $cmd = "firebase deploy --only $onlyArg"
  Write-Host ""; Write-Host "Deploying $fnName ..." -ForegroundColor Cyan

  $attempt = 0
  while ($attempt -le $MaxRetries) {
    $attempt++
  Write-Host "Attempt $attempt/$MaxRetries" -ForegroundColor DarkGray
    $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", $cmd -NoNewWindow -PassThru -Wait

    if ($process.ExitCode -eq 0) {
  Write-Host "$fnName deployed successfully" -ForegroundColor Green
      return 0
    }

    if ($attempt -lt $MaxRetries) {
      $sleep = [Math]::Min($DelaySeconds * [Math]::Pow(2, $attempt-1), 60)
      Write-Host "Deployment failed (exit $($process.ExitCode)). Retrying in $sleep sec..." -ForegroundColor Yellow
      Start-Sleep -Seconds $sleep
    } else {
      Write-Host "$fnName failed after $MaxRetries attempts" -ForegroundColor Red
      return $process.ExitCode
    }
  }
}

$failed = @()
foreach ($fn in $Functions) {
  $code = & $deployOne $fn
  if ($code -ne 0) { $failed += $fn }
}

if ($failed.Count -gt 0) {
  Write-Host ""; Write-Host "Some functions failed to deploy:" -ForegroundColor Red
  $failed | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
  exit 1
} else {
  Write-Host ""; Write-Host "All functions deployed successfully" -ForegroundColor Green
  exit 0
}
