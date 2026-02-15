const API_BASE = process.env.NEXT_PUBLIC_AGENT_API_URL ?? "http://localhost:3001";

function getConnectionHint(): string {
    return `Make sure the agent API is running (e.g. \`npm run dev\` in backend/vercel-agent) and reachable at ${API_BASE}.`;
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
    let res: Response;
    try {
        res = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers: { "Content-Type": "application/json", ...options?.headers },
        });
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg === "Failed to fetch" || msg.includes("fetch")) {
            throw new Error(`Could not reach the agent API. ${getConnectionHint()}`);
        }
        throw e;
    }
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((err as { error?: string }).error ?? "Request failed");
    }
    return res.json();
}

export interface UserProfile {
    _id?: string;
    name: string;
    email: string;
    date_of_birth: string;
    allergies: string;
    primary_doctor: string;
    pharmacy_name: string;
    pharmacy_phone: string;
    address: string;
    notes: string;
}

export interface Medication {
    _id: string;
    name: string;
    dosage: string;
    frequency: string;
    time_of_day: string;
    start_date?: string;
    prescribing_doctor?: string;
    notes?: string;
}

export interface EmergencyContact {
    _id: string;
    name: string;
    phone: string;
    email: string;
    relation: string;
    is_primary: boolean;
}

export interface BillReminder {
    _id: string;
    name: string;
    due_date: string;
    amount: number;
    paid: boolean;
    recurrence: string;
}

export const configApi = {
    getProfile: () => fetchApi<UserProfile | null>("/api/config/profile"),
    putProfile: (body: Partial<UserProfile>) => fetchApi<UserProfile>("/api/config/profile", { method: "PUT", body: JSON.stringify(body) }),

    getMedications: () => fetchApi<Medication[]>("/api/config/medications"),
    postMedication: (body: Partial<Medication>) => fetchApi<Medication>("/api/config/medications", { method: "POST", body: JSON.stringify(body) }),
    putMedication: (id: string, body: Partial<Medication>) => fetchApi<Medication>(`/api/config/medications/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    deleteMedication: (id: string) => fetchApi<{ success: boolean }>(`/api/config/medications/${id}`, { method: "DELETE" }),

    getEmergencyContacts: () => fetchApi<EmergencyContact[]>("/api/config/emergency-contacts"),
    postEmergencyContact: (body: Partial<EmergencyContact>) => fetchApi<EmergencyContact>("/api/config/emergency-contacts", { method: "POST", body: JSON.stringify(body) }),
    putEmergencyContact: (id: string, body: Partial<EmergencyContact>) => fetchApi<EmergencyContact>(`/api/config/emergency-contacts/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    deleteEmergencyContact: (id: string) => fetchApi<{ success: boolean }>(`/api/config/emergency-contacts/${id}`, { method: "DELETE" }),

    getBillReminders: () => fetchApi<BillReminder[]>("/api/config/bill-reminders"),
    postBillReminder: (body: Partial<BillReminder>) => fetchApi<BillReminder>("/api/config/bill-reminders", { method: "POST", body: JSON.stringify(body) }),
    putBillReminder: (id: string, body: Partial<BillReminder>) => fetchApi<BillReminder>(`/api/config/bill-reminders/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    deleteBillReminder: (id: string) => fetchApi<{ success: boolean }>(`/api/config/bill-reminders/${id}`, { method: "DELETE" }),
};
