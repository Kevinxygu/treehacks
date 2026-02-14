"""
Elder Care AI Agent
-------------------
A caring AI assistant for elderly people, powered by Claude Agent SDK.
Connects to multiple MCP servers for medicine tracking, appointments,
groceries, weather, email, calendar, and more.

All MCP servers are Python-based (run via uvx/uv) or use npx for
community servers. Node.js is only needed as a runtime for some
MCP servers distributed via npm.

Usage:
    uv run python agent.py
"""

import asyncio
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from claude_agent_sdk import query, ClaudeAgentOptions, ResultMessage

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).parent
MCP_SERVERS_DIR = SCRIPT_DIR / "mcp-servers"

# Required
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
MONGODB_CONNECTION_STRING = os.environ.get("MONGODB_CONNECTION_STRING", "")

# Optional - Cal.com
CAL_API_KEY = os.environ.get("CAL_API_KEY", "")

# Optional - Google Calendar (Service Account)
GOOGLE_APPLICATION_CREDENTIALS = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")
GOOGLE_CALENDAR_ID = os.environ.get("GOOGLE_CALENDAR_ID", "")

# Optional - Gmail (App Password via IMAP/SMTP)
GMAIL_EMAIL = os.environ.get("GMAIL_EMAIL", "")
GMAIL_PASSWORD = os.environ.get("GMAIL_PASSWORD", "")

# Optional - Other
INSTACART_API_KEY = os.environ.get("INSTACART_API_KEY", "")
NOAA_API_TOKEN = os.environ.get("NOAA_API_TOKEN", "")

# ---------------------------------------------------------------------------
# System Prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """\
You are a warm, patient, and caring AI assistant designed to help elderly people \
with their daily lives. You speak clearly in simple language and always confirm \
before taking any action.

You can help with:

1. **Medication Management** (MongoDB database)
   - Track what medications they take, dosages, and schedules
   - Log when they've taken a dose ("I just took my blood pressure pill")
   - Check adherence ("Did I take my Metformin today?")
   - Store refill reminders

2. **Medicine Information** (Medical MCP)
   - Look up drug details, side effects, and interactions
   - Answer "What is this pill for?" questions

3. **Doctor Appointments** (Cal.com)
   - Book, reschedule, or cancel appointments
   - List upcoming appointments

4. **Calendar & Reminders** (Google Calendar)
   - Set medication reminders as recurring events
   - Check "What's on my schedule today?"
   - Add bill payment reminders

5. **Email Family** (Gmail)
   - Send emails to family members ("Email my daughter that I'm doing well")
   - Check for important emails

6. **Grocery Shopping** (Instacart)
   - Create shopping lists
   - Find nearby stores

7. **Weather** (Weather MCP)
   - Check weather before outings ("Should I go out today?")
   - Weather alerts and air quality

8. **Emergency Contacts & Bills** (MongoDB database)
   - Store and retrieve emergency contact info
   - Track upcoming bills and due dates

9. **Personal Preferences** (Memory MCP + MongoDB)
   - Remember allergies, preferred doctors, pharmacy info
   - Store personal context across conversations

**Important rules:**
- Always confirm before creating, modifying, or deleting anything
- Use simple, clear language - avoid medical jargon unless asked
- If the user seems distressed or mentions an emergency, immediately suggest calling 911 \
  or their emergency contact
- Be proactive: if they mention a new medication, offer to add it to their tracker
- If the database or collections don't exist yet, create them using the MongoDB MCP

**MongoDB Database: elder_care**

The following collections should exist (create them if they don't):

Collection: medications
  { name, dosage, frequency, time_of_day, start_date, prescribing_doctor, notes }

Collection: medication_log
  { medication_name, taken_at (ISO date), skipped (bool), notes }

Collection: emergency_contacts
  { name, phone, relation, is_primary (bool) }

Collection: bill_reminders
  { name, due_date, amount, paid (bool), recurrence }

Collection: user_profile
  { name, date_of_birth, allergies, primary_doctor, pharmacy_name, pharmacy_phone, notes }
"""


def build_mcp_servers() -> dict:
    """Build the MCP server configuration based on available env vars."""
    servers = {}
    allowed = []

    # --- REQUIRED: MongoDB (database for all persistent data) ---
    if MONGODB_CONNECTION_STRING:
        servers["mongodb"] = {
            "command": "npx",
            "args": ["-y", "mongodb-mcp-server@latest"],
            "env": {
                "MDB_MCP_CONNECTION_STRING": MONGODB_CONNECTION_STRING,
            },
        }
        allowed.append("mcp__mongodb__*")
        print("  [+] MongoDB MCP (database)")
    else:
        print("  [-] MongoDB MCP - SKIPPED (set MONGODB_CONNECTION_STRING)")

    # --- Medical MCP (drug info - no API key needed) ---
    servers["medical-mcp"] = {
        "command": "npx",
        "args": ["-y", "medical-mcp"],
    }
    allowed.append("mcp__medical-mcp__*")
    print("  [+] Medical MCP (drug info, FDA, RxNorm)")

    # --- Cal.com (doctor appointments) ---
    if CAL_API_KEY:
        servers["cal"] = {
            "command": "npx",
            "args": ["@calcom/cal-mcp@latest"],
            "env": {"CAL_API_KEY": CAL_API_KEY},
        }
        allowed.append("mcp__cal__*")
        print("  [+] Cal.com MCP (appointments)")
    else:
        print("  [-] Cal.com MCP - SKIPPED (set CAL_API_KEY)")

    # --- Google Calendar MCP (Python, via uvx) ---
    if GOOGLE_APPLICATION_CREDENTIALS and GOOGLE_CALENDAR_ID:
        servers["google-calendar"] = {
            "command": "uvx",
            "args": ["google-calendar-mcp@latest"],
            "env": {
                "GOOGLE_APPLICATION_CREDENTIALS": GOOGLE_APPLICATION_CREDENTIALS,
                "GOOGLE_CALENDAR_ID": GOOGLE_CALENDAR_ID,
            },
        }
        allowed.append("mcp__google-calendar__*")
        print("  [+] Google Calendar MCP (reminders, schedule)")
    else:
        reasons = []
        if not GOOGLE_APPLICATION_CREDENTIALS:
            reasons.append("set GOOGLE_APPLICATION_CREDENTIALS")
        if not GOOGLE_CALENDAR_ID:
            reasons.append("set GOOGLE_CALENDAR_ID")
        print(f"  [-] Google Calendar MCP - SKIPPED ({', '.join(reasons)})")

    # --- Gmail MCP (Python, via uv run) ---
    gmail_server = MCP_SERVERS_DIR / "gmail" / "src" / "email_client" / "server.py"
    gmail_python = MCP_SERVERS_DIR / "gmail" / ".venv" / "bin" / "python"
    if GMAIL_EMAIL and GMAIL_PASSWORD and gmail_server.exists():
        servers["gmail"] = {
            "command": str(gmail_python),
            "args": [str(gmail_server)],
            "env": {
                "GMAIL_EMAIL": GMAIL_EMAIL,
                "GMAIL_PASSWORD": GMAIL_PASSWORD,
                "GMAIL_IMAP_SERVER": "imap.gmail.com",
                "GMAIL_SMTP_SERVER": "smtp.gmail.com",
                "GMAIL_SMTP_PORT": "587",
            },
        }
        allowed.append("mcp__gmail__*")
        print("  [+] Gmail MCP (send/read emails)")
    else:
        reasons = []
        if not GMAIL_EMAIL:
            reasons.append("set GMAIL_EMAIL")
        if not GMAIL_PASSWORD:
            reasons.append("set GMAIL_PASSWORD")
        if not gmail_server.exists():
            reasons.append("run setup_mcps.sh")
        print(f"  [-] Gmail MCP - SKIPPED ({', '.join(reasons)})")

    # --- Weather MCP (no API key needed, NOAA token optional) ---
    weather_env = {}
    if NOAA_API_TOKEN:
        weather_env["NOAA_API_TOKEN"] = NOAA_API_TOKEN
    servers["weather"] = {
        "command": "npx",
        "args": ["-y", "@weather-mcp/server"],
        **({"env": weather_env} if weather_env else {}),
    }
    allowed.append("mcp__weather__*")
    print("  [+] Weather MCP (forecasts, alerts)")

    # --- Memory MCP (knowledge graph, no API key) ---
    memory_path = SCRIPT_DIR / "memory.json"
    servers["memory"] = {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-memory"],
        "env": {"MEMORY_FILE_PATH": str(memory_path)},
    }
    allowed.append("mcp__memory__*")
    print("  [+] Memory MCP (persistent knowledge graph)")

    # --- Instacart MCP (groceries) ---
    if INSTACART_API_KEY:
        servers["instacart"] = {
            "type": "http",
            "url": "https://mcp.instacart.com/mcp",
            "headers": {"Authorization": f"Bearer {INSTACART_API_KEY}"},
        }
        allowed.append("mcp__instacart__*")
        print("  [+] Instacart MCP (grocery shopping)")
    else:
        print("  [-] Instacart MCP - SKIPPED (set INSTACART_API_KEY)")

    return servers, allowed


async def main():
    """Main agent loop - terminal chat interface."""

    # Check required env vars
    if not ANTHROPIC_API_KEY:
        print("ERROR: ANTHROPIC_API_KEY is not set.")
        print("Get one from https://console.anthropic.com and add it to .env")
        sys.exit(1)

    print("=" * 60)
    print("  Elder Care AI Agent")
    print("  Powered by Claude Agent SDK")
    print("=" * 60)
    print()
    print("Connecting to MCP servers...")
    print()

    mcp_servers, allowed_tools = build_mcp_servers()

    print()
    print(f"Connected to {len(mcp_servers)} MCP server(s).")
    print()
    print("Type your message below. Press Ctrl+C to exit.")
    print("-" * 60)
    print()

    session_id = None

    while True:
        try:
            user_input = input("You: ").strip()
            if not user_input:
                continue

            options = ClaudeAgentOptions(
                mcp_servers=mcp_servers,
                allowed_tools=allowed_tools,
                system_prompt=SYSTEM_PROMPT,
                permission_mode="bypassPermissions",
            )

            # Resume session if we have one (maintains conversation context)
            if session_id:
                options.resume = session_id

            print()

            async for message in query(prompt=user_input, options=options):
                # Capture session ID for conversation continuity
                if hasattr(message, "subtype") and message.subtype == "init":
                    if hasattr(message, "session_id"):
                        session_id = message.session_id

                # Print the final result
                if isinstance(message, ResultMessage) and message.subtype == "success":
                    print(f"Assistant: {message.result}")
                    print()

        except KeyboardInterrupt:
            print("\n\nGoodbye! Take care. 💙")
            break
        except EOFError:
            print("\n\nGoodbye! Take care. 💙")
            break
        except Exception as e:
            print(f"\nSomething went wrong: {e}")
            print("Let's try again.\n")


if __name__ == "__main__":
    asyncio.run(main())
