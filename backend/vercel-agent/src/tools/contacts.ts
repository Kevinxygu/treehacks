import { tool } from "ai";
import { z } from "zod";
import { getDb } from "../db.js";

export const getEmergencyContacts = tool({
    description: "Get the user's contacts list with names, phone numbers, emails, and relationships.",
    parameters: z.object({}),
    execute: async () => {
        const db = await getDb();
        const contacts = await db.collection("emergency_contacts").find().toArray();
        return contacts.map((c) => ({
            name: c.name,
            phone: c.phone,
            email: c.email ?? null,
            relation: c.relation,
            is_primary: c.is_primary,
        }));
    },
});

export const addEmergencyContact = tool({
    description: "Add a new contact.",
    parameters: z.object({
        name: z.string().describe("Contact name"),
        phone: z.string().describe("Phone number"),
        email: z.string().optional().describe("Email address"),
        relation: z.string().describe("Relationship (e.g. Daughter, Neighbor)"),
        is_primary: z.boolean().default(false).describe("Whether this is the primary emergency contact"),
    }),
    execute: async (params) => {
        const db = await getDb();
        await db.collection("emergency_contacts").insertOne(params);
        return { success: true, message: `Added ${params.name} as a contact.` };
    },
});

export const updateEmergencyContact = tool({
    description: "Update an existing contact by name (phone, email, relation, etc).",
    parameters: z.object({
        name: z.string().describe("Name of the contact to update"),
        phone: z.string().optional().describe("New phone number"),
        email: z.string().optional().describe("New email address"),
        relation: z.string().optional().describe("New relationship"),
        is_primary: z.boolean().optional().describe("Set as primary contact"),
    }),
    execute: async ({ name, ...updates }) => {
        const db = await getDb();
        const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
        const result = await db.collection("emergency_contacts").updateOne({ name }, { $set: cleanUpdates });
        if (result.matchedCount === 0) {
            return { success: false, message: `Contact "${name}" not found.` };
        }
        return { success: true, message: `Updated contact: ${name}` };
    },
});

export const getUserProfile = tool({
    description: "Get the user's profile information (name, doctor, allergies, etc).",
    parameters: z.object({}),
    execute: async () => {
        const db = await getDb();
        const profile = await db.collection("user_profile").findOne();
        if (!profile) return { message: "No user profile found." };
        const { _id, ...rest } = profile;
        return rest;
    },
});

export const contactTools = {
    getEmergencyContacts,
    addEmergencyContact,
    updateEmergencyContact,
    getUserProfile,
};
