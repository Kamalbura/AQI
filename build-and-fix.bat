@echo off
echo Air Quality Monitoring System - Build Script
echo ============================================
echo.

REM Check if PowerShell is available
powershell -Command "Write-Host 'PowerShell is available'" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PowerShell is not available or not in PATH
    echo Please ensure PowerShell is installed and accessible
    pause
    exit /b 1
)

echo Running build and fix script...
echo.

REM Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "build-and-fix.ps1"

echo.
echo Build script completed. Check the output above for results.
echo.
pause