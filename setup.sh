#!/usr/bin/env bash
set -e

# Check for required tools
if ! command -v node &> /dev/null; then
  echo "Error: node is not installed. Install it from https://nodejs.org"
  exit 1
fi

if ! command -v uv &> /dev/null; then
  echo "Error: uv is not installed. Install it with: curl -LsSf https://astral.sh/uv/install.sh | sh"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd "$ROOT_DIR/frontend"
npm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd "$ROOT_DIR/backend"
uv sync

# Start both servers
echo ""
echo "Starting backend (http://localhost:8000) and frontend (http://localhost:3000)..."
echo "Press Ctrl+C to stop both."
echo ""

cd "$ROOT_DIR/backend"
uv run uvicorn server:app --reload &
BACKEND_PID=$!

cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

# Kill both on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

wait
