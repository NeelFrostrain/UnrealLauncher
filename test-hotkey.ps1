# Test script to verify hotkey functionality
Write-Host "Testing Unreal Launcher hotkey functionality..."

# Check if tracer is running
Write-Host "Checking if tracer is running..."
$tracerProcess = Get-Process -Name "unreal_launcher_tracer" -ErrorAction SilentlyContinue
if ($tracerProcess) {
    Write-Host "✅ Tracer is running (PID: $($tracerProcess.Id))"
} else {
    Write-Host "❌ Tracer is NOT running"
    exit 1
}

# Test spawning the launcher with --palette argument
Write-Host "Testing --palette argument..."
$launcherPath = ".\out\main\index.js"
if (Test-Path $launcherPath) {
    Write-Host "✅ Launcher build found"
    # Note: In production, this would be unreallauncher.exe --palette
    Write-Host "To test hotkey: Press Ctrl+K while tracer is running"
    Write-Host "To test manual palette: Run the launcher with --palette argument"
} else {
    Write-Host "❌ Launcher build not found at $launcherPath"
}

# Check tracer log for activity
$tracerLog = "$env:TEMP\unreal_launcher_hotkey_debug.log"
if (Test-Path $tracerLog) {
    Write-Host "✅ Tracer debug log found at: $tracerLog"
    $lastLines = Get-Content $tracerLog -Tail 5 -ErrorAction SilentlyContinue
    if ($lastLines) {
        Write-Host "Recent tracer activity:"
        $lastLines | ForEach-Object { Write-Host "  $_" }
    }
} else {
    Write-Host "ℹ️  No tracer debug log found (normal on first run)"
}

Write-Host ""
Write-Host "Testing complete. Key points:"
Write-Host "1. Tracer should be running in background"
Write-Host "2. Ctrl+K should trigger palette window"
Write-Host "3. --palette argument should work for direct testing"