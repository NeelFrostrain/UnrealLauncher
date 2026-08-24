@echo off
setlocal EnableDelayedExpansion
set "VSWHERE=%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe"

if not exist "%VSWHERE%" (
    echo [ERROR] Visual Studio Installer is not present on this PC.
    exit /b 1
)

echo =================================================================
echo Checking Visual Studio Installation ^& Required Components
echo =================================================================

set "MISSING=0"

rem Check for C++ Compiler
"%VSWHERE%" -latest -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] MSVC C++ Compiler ^(Latest^)
) else (
    echo [MISSING] MSVC C++ Compiler
    set "MISSING=1"
)

rem Check for Native Game Workload
"%VSWHERE%" -latest -requires Microsoft.VisualStudio.Workload.NativeGame >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Game Development with C++ Workload
) else (
    echo [MISSING] Game Development with C++ Workload
    set "MISSING=1"
)

rem Check for Unreal IDE Integration
"%VSWHERE%" -latest -requires Microsoft.VisualStudio.Component.VC.Unreal.Ide >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Visual Studio Tools for Unreal Engine
) else (
    echo [MISSING] Visual Studio Tools for Unreal Engine
    set "MISSING=1"
)

rem Check for Windows 10 SDK OR Windows 11 SDK
set "HAS_SDK=0"
"%VSWHERE%" -latest -requires Microsoft.VisualStudio.Component.Windows11SDK.22000 >nul 2>&1
if %ERRORLEVEL% EQU 0 set "HAS_SDK=1"

if !HAS_SDK! EQU 0 (
    "%VSWHERE%" -latest -requires Microsoft.VisualStudio.Component.Windows10SDK.19041 >nul 2>&1
    if !ERRORLEVEL! EQU 0 set "HAS_SDK=1"
)

if !HAS_SDK! EQU 1 (
    echo [OK] Windows SDK ^(10 or 11^)
) else (
    echo [MISSING] Windows SDK
    set "MISSING=1"
)

echo -----------------------------------------------------------------
if %MISSING% NEQ 0 (
    echo RESULT: MISSING REQUIRED COMPONENTS!
    echo Please run the installer script before attempting to build Unreal Engine.
    echo -----------------------------------------------------------------
    pause
    exit /b 1
)

echo RESULT: ALL CORE COMPONENTS INSTALLED!
echo =================================================================
echo.
echo =================================================================
echo        UNREAL ENGINE VERSION COMPATIBILITY MENU
echo =================================================================

rem Check MSVC v142 (14.29)
"%VSWHERE%" -latest -requires Microsoft.VisualStudio.Component.VC.14.29.16.11.MCU.x86.x64 >nul 2>&1
if !ERRORLEVEL! EQU 0 (
    echo  [READY] UE 4.27 / UE 5.0 - 5.2   ^(MSVC v142 Toolset Installed^)
) else (
    echo  [NO]    UE 4.27 / UE 5.0 - 5.2   ^(Missing MSVC v142 14.29 Toolset^)
)

rem Check MSVC v143 (14.38)
"%VSWHERE%" -latest -requires Microsoft.VisualStudio.Component.VC.14.38.17.8.x86.x64 >nul 2>&1
if !ERRORLEVEL! EQU 0 (
    echo  [READY] UE 5.3 / UE 5.4          ^(MSVC v14.38 Toolset Installed^)
) else (
    echo  [NO]    UE 5.3 / UE 5.4          ^(Missing MSVC v14.38 Toolset^)
)

rem Check Latest MSVC Toolset (UE 5.5 / 5.6)
"%VSWHERE%" -latest -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 >nul 2>&1
if !ERRORLEVEL! EQU 0 (
    echo  [READY] UE 5.5 / UE 5.6          ^(Latest MSVC v143 Toolset Installed^)
) else (
    echo  [NO]    UE 5.5 / UE 5.6          ^(Missing Default MSVC C++ Tools^)
)

rem Check MSVC v144 / Preview Toolsets (UE 5.7 / 5.8+)
set "HAS_NEXTGEN=0"
"%VSWHERE%" -latest -requires Microsoft.VisualStudio.Component.VC.14.40.17.10.x86.x64 >nul 2>&1
if !ERRORLEVEL! EQU 0 set "HAS_NEXTGEN=1"

if !HAS_NEXTGEN! EQU 0 (
    "%VSWHERE%" -latest -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 >nul 2>&1
    if !ERRORLEVEL! EQU 0 set "HAS_NEXTGEN=1"
)

if !HAS_NEXTGEN! EQU 1 (
    echo  [READY] UE 5.7 / UE 5.8+         ^(MSVC v14.40+ / Modern Toolset Installed^)
) else (
    echo  [NO]    UE 5.7 / UE 5.8+         ^(Requires MSVC v14.4x+ Toolset Update^)
)

echo =================================================================
echo.
pause