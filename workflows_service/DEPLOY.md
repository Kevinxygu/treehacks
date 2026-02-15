# Deploying workflows_service to Vercel

Yes — this deploys as **serverless**. Nitro’s `vercel` preset builds the app into Vercel serverless functions (Node.js); each route runs as a serverless function.

## Vercel account and project

- **CLI login**: `vercel login` (opens browser; pick the correct account or “Log in with GitHub” for the right org).
- **Link to a project**: From `workflows_service`, run `vercel link`. Choose the right **scope** (your user or team), then either pick an existing project or create one. That writes `.vercel/project.json` so `vercel` and `vercel deploy` use that project/account.
- **Switch account/scope**: `vercel switch` to change scope; or log out and in: `vercel logout` then `vercel login`.
- **CI / automation**: Set `VERCEL_TOKEN` (create at [vercel.com/account/tokens](https://vercel.com/account/tokens)); the CLI and `vercel deploy` use it when present.

## Deploy

1. From this directory (`workflows_service`): `npx vercel` (or `vercel deploy --prod` for production).
2. Or in Vercel dashboard: New Project → Import Git → set **Root Directory** to `treehacks/workflows_service` so the app is built from here.

No extra config is needed for Workflow: on Vercel it automatically uses **Vercel World** (storage, queue, auth).

## Environment variables (Vercel project)

Set in Vercel → Project → Settings → Environment Variables:

- `MONGODB_CONNECTION_STRING` – used by `storeHealthData` step.
- `BACKEND_URL` – Whoop API base (e.g. `https://your-backend.vercel.app`). Omit for same-origin or set for separate backend.
- `CORS_ORIGIN` – optional; comma-separated origins (default includes localhost).

## See workflows in the dashboard

- **Vercel dashboard**: open your project → Workflow / observability (workflow runs appear there when using Vercel World).
- **CLI** (from this directory, after `vercel link`):  
  `npx workflow inspect runs --backend vercel`  
  `npx workflow web --backend vercel`  
  These open the Vercel dashboard; use `--localUi` for the local workflow UI instead.

## Triggering the workflow

No code change: still `POST /api/sync-health` with JSON body `{ "elderId": "string" }`.

- **Frontend**: set `NEXT_PUBLIC_WORKFLOWS_URL` to the deployed workflows service URL (e.g. `https://workflows-service-xxx.vercel.app`). The dashboard already calls `fetch(\`${WORKFLOWS_URL}/api/sync-health\`, { method: "POST", body: JSON.stringify({ elderId: "margaret" }) })`.
- **Backend/other**: call the same URL and path with the same body.

## Monorepo (single Vercel project)

If the repo root is the Vercel project and you want this service as part of it, set Root Directory to `treehacks/workflows_service` and ensure the build runs from that directory (Vercel uses the root dir’s `package.json` and `npm run build` there).
