@echo off
setlocal enabledelayedexpansion

echo =======================================================
echo    Starting Kohi Sekai (Vercel CLI + Docker DB)
echo =======================================================
echo.

echo [1/4] Checking Docker Status...
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
    timeout /t 3 /nobreak >nul
) else (
    echo Docker is already running.
)

echo.
echo [2/4] Starting Supabase Local Environment...
call npx supabase status >nul 2>&1
if %errorlevel% neq 0 (
    echo Menjalankan Supabase start...
    call npx supabase start
    if !errorlevel! neq 0 (
        echo [ERROR] Gagal menyalakan Supabase, mencoba sekali lagi...
        timeout /t 3 /nobreak >nul
        call npx supabase start
        if !errorlevel! neq 0 (
            echo [ERROR] Gagal menyalakan Supabase lokal. Periksa Docker Anda.
            pause
            exit /b !errorlevel!
        )
    )
) else (
    echo Supabase local environment is already running!
)

echo.
echo [3/4] Starting Vercel CLI Development Server...
:: Menjalankan vercel dev pada jendela CMD terpisah
start "Kohi Sekai - Vercel Dev" cmd /k "npx vercel dev --listen 3000"

echo.
echo [4/4] Opening Web (User ^& Admin) in Browser...
echo Menunggu server Vercel CLI siap...
timeout /t 6 /nobreak >nul

:: Buka halaman utama (User) dan dashboard (Admin) otomatis
start "" "http://localhost:3000"
start "" "http://localhost:3000/admin"

echo.
echo =======================================================
echo  Vercel Dev ^& Supabase Local Berhasil Dijalankan!
echo  - User Web  : http://localhost:3000
echo  - Admin Web : http://localhost:3000/admin
echo  - Studio DB : http://127.0.0.1:54323
echo =======================================================
echo.
pause
