# Build script that requires admin to create symlinks for code signing tools
# This script elevates to admin and runs npm run build:win

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Requesting administrator privileges..."
    $scriptPath = $MyInvocation.MyCommand.Path
    Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-File", $scriptPath -Verb RunAs
    exit
}

Write-Host "Running as Administrator"
Set-Location "E:\Projects\UnrealLauncher"
npm run build:unpack && npm run build:win
