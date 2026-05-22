# Run from project root or docker/ subfolder — both work
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = if ((Split-Path -Leaf $scriptDir) -eq 'docker') { Split-Path -Parent $scriptDir } else { $scriptDir }
Set-Location $projectRoot

Write-Host "Building Unreal Launcher Docker Image..." -ForegroundColor Cyan

docker build -f docker/Dockerfile -t unreal-launcher-build .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Docker build failed" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Extracting build artifacts..." -ForegroundColor Cyan

if (-not (Test-Path "dist")) {
    New-Item -ItemType Directory -Path "dist" | Out-Null
}

$packageJson = Get-Content -Raw -Path "package.json" | ConvertFrom-Json
$version = $packageJson.version
$zipName = "Unreal Launcher $version.zip"

Write-Host "Copying $zipName to ./dist/..." -ForegroundColor Yellow

$containerId = docker create unreal-launcher-build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to create container" -ForegroundColor Red
    exit $LASTEXITCODE
}

docker cp "${containerId}:/app/$zipName" "./dist/$zipName"
docker rm $containerId | Out-Null

Write-Host "Success! Build artifact is at: ./dist/$zipName" -ForegroundColor Green
