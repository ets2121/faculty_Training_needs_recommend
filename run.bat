@echo off
setlocal ENABLEDELAYEDEXPANSION

echo ==========================================
echo QSU Training Recommender - One Click Run
echo ==========================================

cd /d "%~dp0"

if not exist ".venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found at .venv
    echo Please run: python -m venv .venv && .venv\Scripts\pip install -r requirements.txt
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo [ERROR] Frontend folder missing.
    pause
    exit /b 1
)

echo [1/4] Starting backend server...
start "QSU Backend" cmd /c ".venv\Scripts\activate && uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/4] Waiting for backend health check...
set RETRIES=60
set BACKEND_READY=0
:wait_backend
timeout /t 1 >nul
curl -s -o nul -w "%%{http_code}" http://127.0.0.1:8000/api/v1/health | findstr /C:"200" >nul
if %errorlevel%==0 (
    set BACKEND_READY=1
    echo [OK] Backend is ready.
) else (
    set /a RETRIES-=1
    if !RETRIES! LEQ 0 (
        echo [ERROR] Backend did not become ready in time.
        pause
        exit /b 1
    )
    goto wait_backend
)

echo [3/4] Building frontend...
pushd frontend
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed.
    popd
    pause
    exit /b 1
)
popd

echo [4/4] Starting frontend...
start "QSU Frontend" cmd /c "cd /d "%~dp0frontend" && npm run start"

echo Opening browser...
timeout /t 1 >nul
start http://127.0.0.1:3000

echo ==========================================
echo Backend : http://127.0.0.1:8000
echo Frontend: http://127.0.0.1:3000
echo ==========================================
pause
