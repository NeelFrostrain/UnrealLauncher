# Ensure we are in the project root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "Building Unreal Launcher Docker Image..." -ForegroundColor Cyan

# Build the docker image
docker build -t unreal-launcher-build .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Docker build failed" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Extracting build artifacts..." -ForegroundColor Cyan

# Create the dist directory if it doesn't exist
if (-not (Test-Path "dist")) {
    New-Item -ItemType Directory -Path "dist" | Out-Null
}

# Get the version from package.json
$packageJson = Get-Content -Raw -Path "package.json" | ConvertFrom-Json
$version = $packageJson.version
$zipName = "Unreal Launcher $version.zip"

Write-Host "Copying $zipName to ./dist/..." -ForegroundColor Yellow

# Run a temporary container to copy the zip file out
$containerId = docker create unreal-launcher-build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to create container" -ForegroundColor Red
    exit $LASTEXITCODE
}

docker cp "${containerId}:/app/$zipName" "./dist/$zipName"
docker rm $containerId | Out-Null

Write-Host "Success! Build artifact is at: ./dist/$zipName" -ForegroundColor Green
