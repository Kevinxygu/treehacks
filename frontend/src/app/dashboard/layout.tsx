import DashboardShell from "@/components/DashboardShell";
import type { UserProfile } from "@/lib/config-api";
import type { DbProfile } from "@/components/DashboardShell";

const AGENT_API_URL = process.env.NEXT_PUBLIC_AGENT_API_URL ?? "http://localhost:3001";

async function getDbProfile(): Promise<UserProfile | null> {
  try {
    const res = await fetch(`${AGENT_API_URL}/api/config/profile`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data as UserProfile;
  } catch {
    return null;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getDbProfile();

  return (
    <DashboardShell user={null} profile={profile as DbProfile | null}>
      {children}
    </DashboardShell>
  );
}
