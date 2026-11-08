@echo off
cd /d "%~dp0"
setlocal enabledelayedexpansion

echo ==============================================
echo       Starting Kohi Sekai Local Dev
echo ==============================================
echo.

echo [1/5] Checking Dependencies...
if not exist "node_modules\" (
    echo Installing root dependencies...
    call pnpm install
)
if not exist "frontend\node_modules\" (
    echo Installing frontend dependencies...
    cd frontend
    call pnpm install
    cd ..
)
if not exist "backend\node_modules\" (
    echo Installing backend dependencies...
    cd backend
    call pnpm install
    cd ..
)
if not exist "api\node_modules\" (
    echo Installing api dependencies...
    cd api
    call pnpm install
    cd ..
)

echo.
echo [2/5] Checking Docker Status...
set "DOCKER_FOUND=0"
where docker >nul 2>&1
if %errorlevel% equ 0 set "DOCKER_FOUND=1"
if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" set "DOCKER_FOUND=1"

if "%DOCKER_FOUND%"=="1" goto docker_check_daemon

echo [PERINGATAN] Docker Desktop belum terpasang di komputer ini.
echo Memulai proses download dan instalasi Docker Desktop secara otomatis...
echo Mohon setujui jika jendela konfirmasi Administrator - UAC - muncul.
echo.

where winget >nul 2>&1
if %errorlevel% equ 0 goto install_via_winget

echo [INFO] Mengunduh installer Docker Desktop via curl...
curl.exe -L -# -o "%TEMP%\DockerDesktopInstaller.exe" "https://desktop.docker.com/win/main/amd64/Docker%%20Desktop%%20Installer.exe"
if %errorlevel% neq 0 (
    echo [ERROR] Gagal mengunduh installer Docker.
    goto check_docker_installed
)
echo [INFO] Menjalankan installer Docker Desktop...
start /wait "" "%TEMP%\DockerDesktopInstaller.exe" install
goto check_docker_installed

:install_via_winget
echo [INFO] Menginstal via winget...
winget install -e --id Docker.DockerDesktop --accept-package-agreements --accept-source-agreements

:check_docker_installed

echo.
echo [INFO] Pengecekan setelah instalasi...
if not exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
    where docker >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Docker belum berhasil terpasang atau instalasi dibatalkan.
        echo Silakan unduh manual dari: https://www.docker.com/products/docker-desktop/
        pause
        exit /b 1
    )
)
echo Instalasi Docker Desktop selesai.
echo CATATAN: Untuk instalasi baru, Anda mungkin perlu me-restart PC agar WSL 2 dan Docker Engine aktif.
echo.

:docker_check_daemon

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker daemon is not running. Starting Docker Desktop...
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    ) else (
        start "" docker
    )
    echo Waiting for Docker to start...
    :wait_docker
    timeout /t 3 /nobreak >nul
    docker info >nul 2>&1
    if %errorlevel% neq 0 (
        echo Still waiting for Docker engine to be ready...
        goto wait_docker
    )
    echo Docker engine is ready!
    echo Memberi jeda sejenak agar daemon Docker benar-benar stabil...
    timeout /t 3 /nobreak >nul
) else (
    echo Docker is already running.
)

echo.
echo [3/5] Starting Supabase Local Environment...
call npx supabase status >nul 2>&1
if %errorlevel% neq 0 (
    echo Menjalankan Supabase start...
    call npx supabase start
    if !errorlevel! neq 0 (
        echo [ERROR] Gagal menyalakan Supabase, mencoba sekali lagi setelah jeda 3 detik...
        timeout /t 3 /nobreak >nul
        call npx supabase start
        if !errorlevel! neq 0 (
            echo [ERROR] Failed to start Supabase. Please check Docker and try again.
            pause
            exit /b !errorlevel!
        )
    )
) else (
    echo Supabase local environment is already running!
)

echo.
echo [4/5] Starting Web Development Server (Frontend ^& Backend)...
:: Start the servers in a new console window so it doesn't block this script
start "Kohi Sekai Servers" cmd /k "pnpm run dev"

echo.
echo [5/5] Opening Web and Database in Default Browser...
:: Wait 5 seconds to let the frontend server start
timeout /t 5 /nobreak >nul

:: Buka di browser bawaan / default Windows
start "" "http://localhost:3000"
start "" "http://127.0.0.1:54323"

echo.
echo All services started successfully!
echo You can close this window.
pause
