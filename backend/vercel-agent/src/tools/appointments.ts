import { tool } from "ai";
import { z } from "zod";
import { getDb } from "../db.js";

const CAL_BASE = "https://api.cal.com/v2";

/* Different Cal.com v2 endpoints use different API versions */
const API_VERSIONS = {
    eventTypes: "2024-06-14",
    slots: "2024-06-11",
    bookings: "2024-08-13",
} as const;

const USER_TIMEZONE = "America/Los_Angeles";

function calHeaders(apiVersion: string) {
    const key = process.env.CAL_API_KEY;
    if (!key) throw new Error("CAL_API_KEY is not set.");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "cal-api-version": apiVersion,
    };
}

/** Convert a UTC ISO string to a readable local time string */
function utcToLocal(utcStr: string): string {
    const d = new Date(utcStr);
    return d.toLocaleString("en-US", {
        timeZone: USER_TIMEZONE,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

/** Get the user's name and email from the database profile */
async function getUserInfo(): Promise<{ name: string; email: string }> {
    const db = await getDb();
    const profile = await db.collection("user_profile").findOne();
    return {
        name: profile?.name ?? "User",
        email: profile?.email ?? process.env.GMAIL_EMAIL ?? "user@example.com",
    };
}

/** Fetch the user's own event types and cache them */
let _eventTypesCache: any[] | null = null;

async function getMyEventTypes(): Promise<any[]> {
    if (_eventTypesCache) return _eventTypesCache;

    const res = await fetch(`${CAL_BASE}/event-types`, {
        headers: calHeaders(API_VERSIONS.eventTypes),
    });
    if (!res.ok) throw new Error(`Cal.com event-types error: ${res.status}`);
    const data = await res.json();
    const list = Array.isArray(data.data) ? data.data : [];
    _eventTypesCache = list;
    return list;
}

/** Find event type by duration (in minutes) */
async function findEventTypeByDuration(minutes: number): Promise<any | null> {
    const types = await getMyEventTypes();
    return types.find((et: any) => (et.lengthInMinutes ?? et.length) === minutes && !et.hidden) ?? null;
}

/* ------------------------------------------------------------------ */
/*  Tools                                                              */
/* ------------------------------------------------------------------ */

export const getEventTypes = tool({
    description: "List the user's available appointment types on Cal.com (e.g. 15 min, 30 min meetings).",
    parameters: z.object({}),
    execute: async () => {
        try {
            const types = await getMyEventTypes();
            return {
                eventTypes: types.map((et: any) => ({
                    id: et.id,
                    title: et.title ?? et.slug,
                    slug: et.slug,
                    lengthInMinutes: et.lengthInMinutes ?? et.length,
                    description: et.description ?? "",
                })),
            };
        } catch (err: any) {
            return { error: err.message };
        }
    },
});

export const getAvailableSlots = tool({
    description: "Check available appointment slots for a given duration and date range. " + "Returns times in the user's local timezone.",
    parameters: z.object({
        durationMinutes: z.number().describe("Appointment length in minutes (e.g. 15 or 30)"),
        startDate: z.string().describe("Start date in YYYY-MM-DD format"),
        endDate: z.string().describe("End date in YYYY-MM-DD format"),
    }),
    execute: async ({ durationMinutes, startDate, endDate }) => {
        try {
            const eventType = await findEventTypeByDuration(durationMinutes);
            if (!eventType) {
                const types = await getMyEventTypes();
                const available = types
                    .filter((t: any) => !t.hidden)
                    .map((t: any) => `${t.lengthInMinutes ?? t.length} min`)
                    .join(", ");
                return {
                    error: `No ${durationMinutes}-minute appointment type found. Available: ${available}`,
                };
            }

            const params = new URLSearchParams({
                eventTypeId: String(eventType.id),
                startTime: `${startDate}T00:00:00Z`,
                endTime: `${endDate}T23:59:59Z`,
            });

            const res = await fetch(`${CAL_BASE}/slots/available?${params}`, {
                headers: calHeaders(API_VERSIONS.slots),
            });

            if (!res.ok) {
                const text = await res.text();
                return { error: `Cal.com slots error: ${res.status} - ${text}` };
            }

            const data = await res.json();
            const slots = data.data?.slots ?? {};
            const summary: { date: string; slots: { localTime: string; utc: string }[] }[] = [];

            for (const [date, timeSlots] of Object.entries(slots)) {
                summary.push({
                    date,
                    slots: (timeSlots as any[]).map((s: any) => ({
                        localTime: utcToLocal(s.time),
                        utc: s.time,
                    })),
                });
            }

            return {
                durationMinutes,
                eventTypeId: eventType.id,
                startDate,
                endDate,
                timezone: USER_TIMEZONE,
                availableSlots: summary,
                note: "Use the 'utc' value when booking. The 'localTime' is what to show the user.",
            };
        } catch (err: any) {
            return { error: err.message };
        }
    },
});

export const bookAppointment = tool({
    description: "Book an appointment on Cal.com. Confirm the time with the user first. " + "The user's name and email are pulled automatically from their profile.",
    parameters: z.object({
        durationMinutes: z.number().describe("Appointment length in minutes (e.g. 15 or 30)"),
        startTimeUtc: z.string().describe("The UTC time from getAvailableSlots (e.g. 2026-02-20T18:00:00.000Z)"),
        notes: z.string().optional().describe("Optional reason for the appointment"),
    }),
    execute: async ({ durationMinutes, startTimeUtc, notes }) => {
        try {
            const eventType = await findEventTypeByDuration(durationMinutes);
            if (!eventType) {
                return { error: `No ${durationMinutes}-minute appointment type found.` };
            }

            // Auto-fetch user info from the database
            const user = await getUserInfo();

            const body: any = {
                eventTypeId: eventType.id,
                start: startTimeUtc,
                attendee: {
                    name: user.name,
                    email: user.email,
                    timeZone: USER_TIMEZONE,
                },
                metadata: {},
            };

            if (notes) {
                body.bookingFieldsResponses = { notes };
            }

            const res = await fetch(`${CAL_BASE}/bookings`, {
                method: "POST",
                headers: calHeaders(API_VERSIONS.bookings),
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const text = await res.text();
                return { error: `Booking failed: ${res.status} - ${text}` };
            }

            const data = await res.json();
            const booking = data.data ?? data;
            const localStart = utcToLocal(booking.start ?? startTimeUtc);

            return {
                success: true,
                message: `Appointment booked for ${user.name} at ${localStart}`,
                bookingId: booking.id ?? booking.uid,
                start: booking.start,
                end: booking.end,
                localTime: localStart,
                meetingUrl: booking.location ?? booking.meetingUrl ?? null,
            };
        } catch (err: any) {
            return { error: err.message };
        }
    },
});

export const getUpcomingAppointments = tool({
    description: "Get upcoming/scheduled appointments from Cal.com.",
    parameters: z.object({}),
    execute: async () => {
        try {
            const res = await fetch(`${CAL_BASE}/bookings?status=upcoming`, {
                headers: calHeaders(API_VERSIONS.bookings),
            });

            if (!res.ok) {
                const text = await res.text();
                return { error: `Cal.com bookings error: ${res.status} - ${text}` };
            }

            const data = await res.json();
            const bookings = data.data ?? [];

            if (bookings.length === 0) {
                return { message: "No upcoming appointments found.", bookings: [] };
            }

            return {
                bookings: bookings.map((b: any) => ({
                    id: b.id,
                    uid: b.uid,
                    title: b.title,
                    status: b.status,
                    start: b.start,
                    localStart: utcToLocal(b.start),
                    end: b.end,
                    duration: b.duration,
                    attendees: b.attendees,
                    location: b.location ?? b.meetingUrl,
                })),
            };
        } catch (err: any) {
            return { error: err.message };
        }
    },
});

export const appointmentTools = {
    getEventTypes,
    getAvailableSlots,
    bookAppointment,
    getUpcomingAppointments,
};
