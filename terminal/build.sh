#!/usr/bin/env bash
set -e

echo "✦ Building Pookie Terminal Native Linux Executable..."

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"

cd "$PROJECT_ROOT"

pyinstaller \
  --noconfirm \
  --onedir \
  --windowed \
  --name "PookieTerminal" \
  --exclude PySide6 \
  terminal/app.py

echo "✓ Build complete! Executable located at: dist/PookieTerminal/PookieTerminal"
