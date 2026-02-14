#!/usr/bin/env bash
set -e

# Setup script for MCP servers that need local installation
# (Google Calendar and Gmail MCP servers require clone + build)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MCP_DIR="$SCRIPT_DIR/mcp-servers"

mkdir -p "$MCP_DIR"

echo "=== Setting up Google Calendar MCP Server ==="
if [ ! -d "$MCP_DIR/gcal" ]; then
    git clone https://github.com/highlight-ing/google-calendar-mcp-server.git "$MCP_DIR/gcal"
    cd "$MCP_DIR/gcal"
    npm install
    npm run build
    echo "Google Calendar MCP server built successfully."
else
    echo "Google Calendar MCP server already exists, skipping clone."
    cd "$MCP_DIR/gcal"
    npm install
    npm run build
fi

echo ""
echo "=== Setting up Gmail MCP Server ==="
if [ ! -d "$MCP_DIR/gmail" ]; then
    git clone https://github.com/highlight-ing/gmail-mcp-server.git "$MCP_DIR/gmail"
    cd "$MCP_DIR/gmail"
    npm install
    npm run build
    echo "Gmail MCP server built successfully."
else
    echo "Gmail MCP server already exists, skipping clone."
    cd "$MCP_DIR/gmail"
    npm install
    npm run build
fi

echo ""
echo "=== MCP Server Setup Complete ==="
echo ""
echo "Next steps for Google OAuth:"
echo "1. Go to https://console.cloud.google.com"
echo "2. Create a project, enable Gmail API + Google Calendar API"
echo "3. Create OAuth credentials (Web application):"
echo "   - Redirect URI for Calendar: http://localhost:3000/code"
echo "   - Redirect URI for Gmail:    http://localhost:3001/code"
echo "4. Create credentials.json in each MCP server directory:"
echo ""
echo "   $MCP_DIR/gcal/credentials.json"
echo "   $MCP_DIR/gmail/credentials.json"
echo ""
echo '   Format: {"web":{"client_id":"...","client_secret":"...","redirect_uris":["http://localhost:300X/code"],"auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token"}}'
echo ""
echo "5. Get refresh tokens:"
echo "   cd $MCP_DIR/gcal && node get-refresh-token.js"
echo "   cd $MCP_DIR/gmail && node get-refresh-token.js"
echo ""
echo "6. Copy the access tokens to your .env file"
