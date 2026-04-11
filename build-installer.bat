@echo off
REM Build script - requests admin privileges and builds the Windows installer
REM This is needed because code signing tools require symlink support on Windows

echo.
echo ===== Unreal Launcher Builder =====
echo.

REM Check if running as admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting Administrator privileges...
    echo.
    
    REM Re-run as admin
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

REM We're admin, proceed with build
echo Running as Administrator
echo.
echo Building Windows installer...
echo.

cd /d "E:\Projects\UnrealLauncher"

call npm run build:win

echo.
if %errorlevel% equ 0 (
    echo.
    echo ===== BUILD SUCCESSFUL =====
    echo.
    echo Installer created at:
    dir dist\*.exe /b 2>nul || echo   (Portable build in dist\win-unpacked\)
    echo.
    pause
) else (
    echo.
    echo ===== BUILD FAILED =====
    echo Error code: %errorlevel%
    echo.
    pause
)
