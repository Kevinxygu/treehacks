#!/usr/bin/env bash
set -e

# Setup script for MCP servers that need local installation.
# Google Calendar MCP is on PyPI (no clone needed).
# Gmail MCP needs a clone (Python, uses uv).

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
echo "=== Google Calendar MCP ==="
echo "No clone needed! Runs via: uvx google-calendar-mcp@latest"
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
echo ""
echo "--- Google Calendar Setup ---"
echo "1. Go to https://console.cloud.google.com"
echo "2. Create a project, enable Google Calendar API"
echo "3. Create a Service Account (IAM > Service Accounts)"
echo "4. Download the JSON key file"
echo "5. Share your Google Calendar with the service account email"
echo "   (Calendar Settings > Share > Add the service account email)"
echo "6. Add to .env:"
echo "   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json"
echo "   GOOGLE_CALENDAR_ID=your_email@gmail.com"
