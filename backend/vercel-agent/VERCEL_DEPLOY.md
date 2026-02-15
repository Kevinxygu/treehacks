# Hybrid deploy: main server normal + tools serverless on Vercel

- **Main server**: runs as a normal Node process (e.g. Railway, Fly.io, or `npm run dev` locally). Handles `/api/health`, `/api/voice-chat`, `/api/chat`, config, etc.
- **Tools**: run as a single Vercel serverless function. When `TOOLS_SERVERLESS_URL` is set on the main server, it delegates every tool call (getRidePrices, getMedications, orderGroceries, etc.) to that URL instead of running tools in-process.

## 1. Deploy the tool runner to Vercel

1. In [Vercel](https://vercel.com): New Project → Import this repo.
2. **Root Directory**: `backend/vercel-agent`.
3. **Environment variables**: set the same as your main server (MongoDB, ElevenLabs, Anthropic/Browserbase, etc.) — the serverless function runs the real tool code and needs the same env.
4. Deploy. You’ll get a URL like `https://your-project.vercel.app`.

The only serverless route is **POST /api/tools/run** (body: `{ "tool": "getRidePrices", "args": { "pickup": "...", "destination": "..." } }`). It runs the requested tool and returns the result. `maxDuration` is 120s so long-running tools (e.g. Browserbase rides) can finish.

## 2. Run the main server and point it at the tool URL

Run the Express server as usual (same host as today, or any other host):

```bash
cd backend/vercel-agent
npm run dev
```

To use **remote (serverless) tools**, set:

```bash
export TOOLS_SERVERLESS_URL=https://your-project.vercel.app
npm run dev
```

Then every tool call from the agent is sent to `https://your-project.vercel.app/api/tools/run` and the result is returned to the main server. If you don’t set `TOOLS_SERVERLESS_URL`, tools run in-process as before.

## Summary

| Component      | Where it runs        | Role |
|----------------|----------------------|------|
| Express app    | Your server / local  | Health, config, voice-chat, chat, generate; orchestrates the AI and calls tools (local or remote). |
| Tool execution | Vercel serverless    | POST /api/tools/run runs one tool by name; used only when TOOLS_SERVERLESS_URL is set. |

This keeps the server as a single long-lived process and moves heavy or variable-length tool work (Browserbase, external APIs) into serverless.
