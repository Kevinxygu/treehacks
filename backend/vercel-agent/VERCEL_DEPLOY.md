# Deploy vercel-agent to Vercel (main + tools serverless)

**If Vercel keeps deploying `main`:** In the project go to **Settings → Git**, set **Production Branch** to `agent-frontend`, save, then trigger a new deployment (Redeploy or push to `agent-frontend`).

- **Main app**: Express is the default export from `src/index.ts`. Vercel runs it as a single serverless function (all routes: `/api/health`, `/api/voice-chat`, etc.).
- **Tools**: `api/tools/run.ts` is a separate serverless function (long timeout) for tool execution. The main app calls it when `TOOLS_SERVERLESS_URL` is set.

## Deploy (including branch `agent-frontend`)

1. **Push your branch** so Vercel can use it:
   ```bash
   git add -A && git commit -m "Vercel deploy: main + serverless tools" && git push origin agent-frontend
   ```

2. In [Vercel](https://vercel.com): **New Project** → Import your Git repo (e.g. GitHub).

3. **Settings**:
   - **Root Directory**: `backend/vercel-agent` (so the project root for the deployment is this folder).
   - **Production branch**: In **Settings → Git**, set **Production Branch** to `agent-frontend` so deploys use this branch instead of `main`. Save and redeploy.

4. **Environment variables**: Add the same vars as in `.env` (MongoDB, Anthropic, ElevenLabs, Browserbase, Cal.com, Gmail, etc.). Both the main function and the tools function use the same env.

5. **Deploy** (triggered by the push, or click Deploy).

## After deploy

Set **TOOLS_SERVERLESS_URL** to your deployment URL so the main app delegates tool calls to the tools function, e.g.:

- `https://your-project.vercel.app`

Redeploy or set it in the Vercel dashboard and redeploy. The main handler will then send each tool call to `POST /api/tools/run` on the same host.

## Local

- `npm run dev`: Express runs normally; tools run in-process (do not set `TOOLS_SERVERLESS_URL`).
- Or set `TOOLS_SERVERLESS_URL=https://your-project.vercel.app` to test with remote tools.
