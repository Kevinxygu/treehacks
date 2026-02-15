import { tool } from "ai";
import { z } from "zod";
import { getDb } from "../db.js";

export const getBillReminders = tool({
    description: "Get upcoming bill reminders. Shows bills sorted by due date, optionally filtered to unpaid only.",
    parameters: z.object({
        unpaid_only: z.boolean().default(true).describe("Only show unpaid bills"),
    }),
    execute: async ({ unpaid_only }) => {
        const db = await getDb();
        const filter = unpaid_only ? { paid: false } : {};
        const bills = await db.collection("bill_reminders").find(filter).sort({ due_date: 1 }).toArray();
        return bills.map((b) => ({
            name: b.name,
            due_date: b.due_date,
            amount: b.amount,
            paid: b.paid,
            recurrence: b.recurrence,
        }));
    },
});

export const addBillReminder = tool({
    description: "Add a new bill reminder.",
    parameters: z.object({
        name: z.string().describe("Bill name (e.g. Electric Bill)"),
        due_date: z.string().describe("Due date in YYYY-MM-DD format"),
        amount: z.number().describe("Amount in dollars"),
        recurrence: z.enum(["one-time", "weekly", "monthly", "quarterly", "yearly"]).default("monthly").describe("How often the bill recurs"),
    }),
    execute: async (params) => {
        const db = await getDb();
        await db.collection("bill_reminders").insertOne({ ...params, paid: false });
        return {
            success: true,
            message: `Added bill reminder: ${params.name} - $${params.amount} due ${params.due_date}`,
        };
    },
});

export const markBillPaid = tool({
    description: "Mark a bill as paid.",
    parameters: z.object({
        name: z.string().describe("Name of the bill to mark as paid"),
    }),
    execute: async ({ name }) => {
        const db = await getDb();
        const result = await db.collection("bill_reminders").updateOne({ name, paid: false }, { $set: { paid: true } });
        if (result.matchedCount === 0) {
            return {
                success: false,
                message: `No unpaid bill found with name "${name}".`,
            };
        }
        return { success: true, message: `Marked "${name}" as paid.` };
    },
});

export const billTools = {
    getBillReminders,
    addBillReminder,
    markBillPaid,
};
