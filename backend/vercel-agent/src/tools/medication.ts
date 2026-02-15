import { tool } from "ai";
import { z } from "zod";
import { getDb } from "../db.js";

export const getMedications = tool({
    description: "Get all current medications for the user, including dosage and schedule.",
    parameters: z.object({}),
    execute: async () => {
        const db = await getDb();
        const meds = await db.collection("medications").find().toArray();
        return meds.map((m) => ({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            time_of_day: m.time_of_day,
            prescribing_doctor: m.prescribing_doctor,
            notes: m.notes,
        }));
    },
});

export const addMedication = tool({
    description: "Add a new medication to the user's medication list.",
    parameters: z.object({
        name: z.string().describe("Medication name"),
        dosage: z.string().describe("Dosage (e.g. 500mg)"),
        frequency: z.string().describe("How often (e.g. Twice daily)"),
        time_of_day: z.string().describe("When to take (e.g. 8:00 AM, 8:00 PM)"),
        prescribing_doctor: z.string().optional().describe("Doctor who prescribed"),
        notes: z.string().optional().describe("Additional notes"),
    }),
    execute: async (params) => {
        const db = await getDb();
        const doc = {
            ...params,
            start_date: new Date().toISOString().split("T")[0],
        };
        await db.collection("medications").insertOne(doc);
        return { success: true, message: `Added ${params.name} to medications.` };
    },
});

export const logMedicationTaken = tool({
    description: "Log that a medication was taken or skipped. Use this when the user says they took or missed a dose.",
    parameters: z.object({
        medication_name: z.string().describe("Name of the medication"),
        skipped: z.boolean().default(false).describe("True if the dose was skipped"),
        notes: z.string().optional().describe("Optional notes"),
    }),
    execute: async (params) => {
        const db = await getDb();
        await db.collection("medication_log").insertOne({
            ...params,
            taken_at: new Date().toISOString(),
        });
        const action = params.skipped ? "skipped" : "taken";
        return {
            success: true,
            message: `Logged ${params.medication_name} as ${action}.`,
        };
    },
});

export const getMedicationLog = tool({
    description: "Get the medication log history showing what was taken or skipped recently.",
    parameters: z.object({
        limit: z.number().default(10).describe("Number of recent entries to return"),
    }),
    execute: async ({ limit }) => {
        const db = await getDb();
        const logs = await db.collection("medication_log").find().sort({ taken_at: -1 }).limit(limit).toArray();
        return logs.map((l) => ({
            medication_name: l.medication_name,
            taken_at: l.taken_at,
            skipped: l.skipped,
            notes: l.notes,
        }));
    },
});

export const medicationTools = {
    getMedications,
    addMedication,
    logMedicationTaken,
    getMedicationLog,
};
