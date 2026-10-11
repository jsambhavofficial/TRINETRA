# ==============================================================================
# NEXUS — SINGLE COMMAND LOCAL DEVELOPMENT RUNNER (WINDOWS POWERSHELL)
# ==============================================================================

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  NEXUS — The Living Intelligence Layer for the Physical World  " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$WorkspaceRoot = $PSScriptRoot

# 1. Start Backend API Service
Write-Host "[1/2] Starting Backend Operational Gateway (FastAPI) on Port 8000..." -ForegroundColor Green
$BackendJob = Start-Job -ScriptBlock {
    param($root)
    Set-Location "$root\services\api"
    .\.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
} -ArgumentList $WorkspaceRoot

Start-Sleep -Seconds 3

# 2. Start Frontend Mission Control App
Write-Host "[2/2] Starting Frontend Mission Control (Next.js) on Port 3000..." -ForegroundColor Green
$FrontendJob = Start-Job -ScriptBlock {
    param($root)
    Set-Location "$root\apps\web"
    npm run dev
} -ArgumentList $WorkspaceRoot

Write-Host ""
Write-Host "=================================================================" -ForegroundColor Green
Write-Host "  NEXUS SYSTEM IS LIVE!                                          " -ForegroundColor Green
Write-Host "  Mission Control:   http://localhost:3000                      " -ForegroundColor White
Write-Host "  3D World Twin:     http://localhost:3000/world                " -ForegroundColor White
Write-Host "  Backend API Docs:  http://localhost:8000/docs                 " -ForegroundColor White
Write-Host "  Health Probe:      http://localhost:8000/health/dependencies  " -ForegroundColor White
Write-Host "=================================================================" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop all services..." -ForegroundColor Yellow

try {
    while ($true) {
        Receive-Job -Job $BackendJob | Write-Host
        Receive-Job -Job $FrontendJob | Write-Host
        Start-Sleep -Seconds 2
    }
} finally {
    Write-Host "Stopping all NEXUS services..." -ForegroundColor Red
    Stop-Job $BackendJob -ErrorAction SilentlyContinue
    Remove-Job $BackendJob -ErrorAction SilentlyContinue
    Stop-Job $FrontendJob -ErrorAction SilentlyContinue
    Remove-Job $FrontendJob -ErrorAction SilentlyContinue
    Write-Host "All services stopped." -ForegroundColor White
}
