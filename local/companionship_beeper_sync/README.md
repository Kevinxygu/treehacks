# Companionship Beeper sync (local)

Polls the Beeper Desktop API for new messages in a WhatsApp family group, downloads image attachments, and uploads them to your backend via presigned URLs. **Runs only on the machine where Beeper Desktop is installed** (not deployed to Vercel).

## Setup

1. Install Beeper Desktop, add WhatsApp, join the family group.
2. In Beeper Desktop: **Settings → Developers** → enable **Beeper Desktop API** → copy the access token.
3. In this directory:
   - Copy `.env.example` to `.env` and set `BEEPER_ACCESS_TOKEN`.
   - Optionally set `BACKEND_PRESIGN_URL` (your API that returns presigned S3 URLs) and `FAMILY_ID`.
4. Install deps: `uv sync` or `pip install -e .`

## Run

```bash
uv run python main.py
```

Or with env from file:

```bash
set -a && source .env && set +a && uv run python main.py
```

Polling uses the chat id extracted from `beeper://select-thread/whatsapp/!pb7tGC3qbMFuFnZN3YH4:beeper.local`. Override with `BEEPER_CHAT_ID` if needed.
