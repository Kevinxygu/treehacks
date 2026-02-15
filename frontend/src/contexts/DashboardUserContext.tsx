"use client";

import { createContext, useContext, useMemo } from "react";

/** Profile from the database (agent config) - used for display name everywhere */
export interface DashboardProfile {
    name?: string | null;
    email?: string | null;
    [key: string]: unknown;
}

const DashboardProfileContext = createContext<DashboardProfile | null>(null);

export function DashboardUserProvider({ profile, children }: { profile: DashboardProfile | null; children: React.ReactNode }) {
    const value = useMemo(() => profile, [profile]);
    return <DashboardProfileContext.Provider value={value}>{children}</DashboardProfileContext.Provider>;
}

export function useDashboardProfile(): DashboardProfile | null {
    const ctx = useContext(DashboardProfileContext);
    return ctx ?? null;
}

/** Display name and first name from the database profile */
export function useDashboardUserName(): { displayName: string; firstName: string } {
    const profile = useDashboardProfile();
    const name = profile?.name ?? profile?.email ?? "User";
    const firstName = name.split(/\s+/)[0] || name;
    return { displayName: name, firstName };
}
