# ==============================================================================
# TRINETRA - SINGLE COMMAND LOCAL DEVELOPMENT RUNNER (WINDOWS POWERSHELL)
# ==============================================================================

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  TRINETRA - State Governance Intelligence and Operational Hub  " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$WorkspaceRoot = $PSScriptRoot

# Determine Python command
$PythonCmd = "python"
if (Test-Path "$WorkspaceRoot\services\api\.venv\Scripts\python.exe") {
    $PythonCmd = "$WorkspaceRoot\services\api\.venv\Scripts\python.exe"
} elseif (Test-Path "$WorkspaceRoot\.venv\Scripts\python.exe") {
    $PythonCmd = "$WorkspaceRoot\.venv\Scripts\python.exe"
}

# 1. Start Backend API Service
Write-Host "[1/2] Starting Backend Operational Gateway (FastAPI) on Port 8000..." -ForegroundColor Green
$BackendJob = Start-Job -ScriptBlock {
    param($root, $py)
    Set-Location "$root\services\api"
    & $py -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
} -ArgumentList $WorkspaceRoot, $PythonCmd

Start-Sleep -Seconds 3

# 2. Start Frontend Next.js App
Write-Host "[2/2] Starting Frontend Governance Platform (Next.js) on Port 3000..." -ForegroundColor Green
$FrontendJob = Start-Job -ScriptBlock {
    param($root)
    Set-Location "$root\apps\web"
    npm run dev
} -ArgumentList $WorkspaceRoot

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Green
Write-Host "  TRINETRA SYSTEM IS LIVE!                                       " -ForegroundColor Green
Write-Host "  Portal Gateway:    http://localhost:3000                      " -ForegroundColor White
Write-Host "  State Leadership:  http://localhost:3000/portal/state-leadership" -ForegroundColor White
Write-Host "  District Admin:    http://localhost:3000/portal/district-admin" -ForegroundColor White
Write-Host "  Department Hub:    http://localhost:3000/portal/department    " -ForegroundColor White
Write-Host "  Citizen Portal:    http://localhost:3000/portal/citizen       " -ForegroundColor White
Write-Host "  3D World Twin:     http://localhost:3000/world                " -ForegroundColor White
Write-Host "  Backend API Docs:  http://localhost:8000/docs                 " -ForegroundColor White
Write-Host "  Health Probe:      http://localhost:8000/health               " -ForegroundColor White
Write-Host "=================================================================" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop all services..." -ForegroundColor Yellow

try {
    while ($true) {
        Receive-Job -Job $BackendJob | Write-Host
        Receive-Job -Job $FrontendJob | Write-Host
        Start-Sleep -Seconds 2
    }
} finally {
    Write-Host "Stopping all TRINETRA services..." -ForegroundColor Red
    Stop-Job $BackendJob -ErrorAction SilentlyContinue
    Remove-Job $BackendJob -ErrorAction SilentlyContinue
    Stop-Job $FrontendJob -ErrorAction SilentlyContinue
    Remove-Job $FrontendJob -ErrorAction SilentlyContinue
    Write-Host "All services stopped." -ForegroundColor White
}
