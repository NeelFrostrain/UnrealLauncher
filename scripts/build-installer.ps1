# Build script that runs with admin privileges for code signing
param(
    [switch]$AsAdmin
)

if (-not $AsAdmin) {
    Write-Host "⚠ Admin privileges required for code signing tool extraction"
    Write-Host "Requesting administrator privileges..."

    $scriptPath = $MyInvocation.MyCommand.Path
    $args = "-ExecutionPolicy Bypass -File `"$scriptPath`" -AsAdmin"
    Start-Process powershell -ArgumentList $args -Verb RunAs -Wait
    exit
}

Write-Host "✓ Running as Administrator" -ForegroundColor Green
# Navigate to project root (one level up from scripts/)
Set-Location (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))

Write-Host ""
Write-Host "Building Unreal Launcher installer..."
Write-Host ""

npm run build:win

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Build completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Installer location:"
    Get-ChildItem -Path "dist" -Filter "*.exe" -Recurse | Select-Object FullName
} else {
    Write-Host ""
    Write-Host "✗ Build failed" -ForegroundColor Red
}
