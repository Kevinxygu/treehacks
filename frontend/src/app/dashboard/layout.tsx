import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
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
  const [session, profile] = await Promise.all([
    auth0.getSession(),
    getDbProfile(),
  ]);
  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <DashboardShell user={session.user} profile={profile as DbProfile | null}>
      {children}
    </DashboardShell>
  );
}
