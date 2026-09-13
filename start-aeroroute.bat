@echo off
title The Long Way Around
color 0B

cd /d "%~dp0"

:: Detect Node.js executable
set "NODE_EXE="

:: 1. Check if node is in system PATH
where node >nul 2>nul
if %errorlevel% equ 0 (
    set "NODE_EXE=node"
    goto :found_node
)

:: 2. Check bundled Cursor helper node
if exist "%USERPROFILE%\Downloads\random\cursor\resources\app\resources\helpers\node.exe" (
    set "NODE_EXE=%USERPROFILE%\Downloads\random\cursor\resources\app\resources\helpers\node.exe"
    goto :found_node
)

:: 3. Check standard Program Files installation
if exist "C:\Program Files\nodejs\node.exe" (
    set "NODE_EXE=C:\Program Files\nodejs\node.exe"
    goto :found_node
)

:: 4. Check AppData local
if exist "%LOCALAPPDATA%\Programs\node\node.exe" (
    set "NODE_EXE=%LOCALAPPDATA%\Programs\node\node.exe"
    goto :found_node
)

:found_node
if "%NODE_EXE%"=="" (
    echo [ERROR] Node.js executable could not be found.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ====================================================================
echo   THE LONG WAY AROUND
echo   Starting server...
echo ====================================================================
echo.
echo Opening in your default browser at http://localhost:5173/
echo.
echo (Keep this window open while using the app)
echo.

"%NODE_EXE%" "%~dp0node_modules\vite\bin\vite.js" --open --port 5173

echo.
echo Server has stopped.
pause
