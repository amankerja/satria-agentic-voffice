@echo off
setlocal
chcp 65001 >nul
title SATRIA AI WORKFORCE - Command Center

where node >nul 2>nul
if %errorlevel% neq 0 goto :no_node

if not exist "%~dp0node_modules" goto :no_modules

:run_cli
node "%~dp0satria-cli.mjs" %*
set EXIT_CODE=%errorlevel%
if %EXIT_CODE% neq 0 (
    if "%~1"=="" pause
)
exit /b %EXIT_CODE%

:no_node
echo.
echo ============================================================================
echo  [X] ERROR: Node.js runtime tidak ditemukan di PATH sistem!
echo ============================================================================
echo  SATRIA AI WORKFORCE membutuhkan Node.js v18.0.0 atau lebih baru.
echo  Silakan unduh dan pasang dari: https://nodejs.org
echo.
pause
exit /b 1

:no_modules
echo.
echo ----------------------------------------------------------------------------
echo  [i] Dependencies belum terpasang: folder node_modules tidak ditemukan.
echo  Menjalankan npm install otomatis...
echo ----------------------------------------------------------------------------
echo.
call npm install
if %errorlevel% neq 0 (
    echo.
    echo  [X] Gagal melakukan instalasi dependencies. Periksa koneksi internet Anda.
    echo.
    pause
    exit /b 1
)
goto :run_cli
