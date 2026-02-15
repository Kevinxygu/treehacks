const PRODUCTION_WORKFLOWS_URL =
  "https://workflows-service-5n1e8n93y-paultibes-projects.vercel.app";
const raw =
  process.env.WORKFLOWS_URL || process.env.NEXT_PUBLIC_WORKFLOWS_URL;
const WORKFLOWS_URL =
  raw && !raw.includes("localhost") ? raw : PRODUCTION_WORKFLOWS_URL;

const BYPASS_SECRET =
  process.env.VERCEL_AUTOMATION_BYPASS_SECRET ||
  process.env.WORKFLOWS_VERCEL_BYPASS_SECRET;

export async function POST(request: Request) {
  const body = await request.json();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (BYPASS_SECRET) headers["x-vercel-protection-bypass"] = BYPASS_SECRET;
  const res = await fetch(`${WORKFLOWS_URL}/api/sync-health`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const contentType = res.headers.get("content-type");
  const data =
    contentType?.includes("application/json")
      ? await res.json().catch(() => ({}))
      : { error: true, message: await res.text().catch(() => "Unknown error") };
  if (!res.ok && typeof data === "object" && !("error" in data))
    (data as Record<string, unknown>).error = true;
  return Response.json(data, { status: res.status });
}
