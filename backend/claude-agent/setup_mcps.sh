#!/usr/bin/env bash
set -e

# Setup script for MCP servers that need local installation.
# Only Gmail MCP needs a clone (Python, uses uv).

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MCP_DIR="$SCRIPT_DIR/mcp-servers"

mkdir -p "$MCP_DIR"

echo "=== Setting up Gmail MCP Server (Python) ==="
if [ ! -d "$MCP_DIR/gmail" ]; then
    git clone https://github.com/david-strejc/gmail-mcp-server.git "$MCP_DIR/gmail"
    cd "$MCP_DIR/gmail"
    uv venv
    uv sync
    echo "Gmail MCP server installed successfully."
else
    echo "Gmail MCP server already exists, updating deps..."
    cd "$MCP_DIR/gmail"
    uv sync
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "--- Gmail Setup ---"
echo "1. Go to https://myaccount.google.com/apppasswords"
echo "   (You need 2FA enabled on your Google account)"
echo "2. Create an App Password for 'Mail'"
echo "3. Add to .env:"
echo "   GMAIL_EMAIL=your_email@gmail.com"
echo "   GMAIL_PASSWORD=your_16_char_app_password"
