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

# Install mobile dependencies
echo "Installing mobile dependencies..."
cd "$ROOT_DIR/mobile"
npm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd "$ROOT_DIR/backend"
uv sync

# Start all servers
echo ""
echo "Starting services:"
echo "  - Backend: http://localhost:8000"
echo "  - Frontend: http://localhost:3002"
echo "  - Mobile: Expo dev server"
echo "Press Ctrl+C to stop all services."
echo ""

cd "$ROOT_DIR/backend"
uv run uvicorn server:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

cd "$ROOT_DIR/frontend"
PORT=3002 npm run dev &
FRONTEND_PID=$!

cd "$ROOT_DIR/mobile"
npx expo start &
MOBILE_PID=$!

# End all processes on end
trap "kill $BACKEND_PID $FRONTEND_PID $MOBILE_PID 2>/dev/null" EXIT

wait
