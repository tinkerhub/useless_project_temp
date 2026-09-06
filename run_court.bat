@echo off
title Tab Eviction Court Launcher
echo ===================================================
echo     STARTING TAB EVICTION COURT LOCAL STACK
echo ===================================================

echo [1/2] Launching Ollama Llama-3.2:3b...
start "Ollama Service" cmd /k "ollama run llama3.2:3b"

echo [2/2] Launching FastAPI Backend on Port 8000...
start "FastAPI Server" cmd /k "call venv\Scripts\activate && uvicorn main:app --reload --port 8000"

echo.
echo All background engines are booting!
echo Keep those windows open while using the Chrome extension.
pause