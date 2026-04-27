@echo off
title SkillSprint - Starting...
color 0A

echo.
echo  =============================================
echo   SKILLSPRINT - One Click Starter
echo  =============================================
echo.

:: Get the directory where this script lives
cd /d "%~dp0"

:: Activate virtual environment
if exist ".venv\Scripts\activate.bat" (
    echo  [OK] Activating virtual environment...
    call .venv\Scripts\activate.bat
) else (
    echo  [!!] No .venv found - creating one...
    python -m venv .venv
    call .venv\Scripts\activate.bat
    echo  [OK] Installing dependencies...
    pip install -r backend\requirements.txt -q
)

:: Start Backend API server (port 8000) in background
echo  [OK] Starting Backend API on port 8000...
start /B "" python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload >nul 2>&1

:: Wait a moment for backend to initialize
timeout /t 2 /nobreak >nul

:: Start Frontend server (port 5500) in background
echo  [OK] Starting Frontend on port 5500...
start /B "" python server.py >nul 2>&1

:: Wait a moment then open browser
timeout /t 2 /nobreak >nul

echo.
echo  [READY] Both servers are running!
echo.
echo  Frontend:  http://localhost:5500/frontend/html/signup.html
echo  Backend:   http://localhost:8000
echo  API Docs:  http://localhost:8000/docs
echo.

:: Open the browser automatically
start http://localhost:5500/frontend/html/signup.html

echo  Press any key to STOP both servers...
echo.
pause >nul

:: Kill the servers
echo.
echo  [OK] Stopping servers...
taskkill /F /IM "uvicorn.exe" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq python server.py" >nul 2>&1

:: Kill python processes running our servers
for /f "tokens=2" %%a in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do (
    for /f "tokens=5" %%b in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do (
        taskkill /F /PID %%b >nul 2>&1
    )
)
for /f "tokens=2" %%a in ('netstat -ano ^| findstr ":5500" ^| findstr "LISTENING"') do (
    for /f "tokens=5" %%b in ('netstat -ano ^| findstr ":5500" ^| findstr "LISTENING"') do (
        taskkill /F /PID %%b >nul 2>&1
    )
)

echo  [OK] All servers stopped. Goodbye!
timeout /t 2 /nobreak >nul
