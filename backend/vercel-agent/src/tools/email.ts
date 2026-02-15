import { tool } from "ai";
import { z } from "zod";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import nodemailer from "nodemailer";
import { getDb } from "../db.js";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getImapClient() {
    const email = process.env.GMAIL_EMAIL;
    const password = process.env.GMAIL_APP_PASSWORD;
    if (!email || !password) {
        throw new Error("GMAIL_EMAIL and GMAIL_APP_PASSWORD must be set.");
    }
    return new ImapFlow({
        host: "imap.gmail.com",
        port: 993,
        secure: true,
        auth: { user: email, pass: password },
        logger: false,
    });
}

function getSmtpTransport() {
    return nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.GMAIL_EMAIL,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });
}

/** Look up a contact's email by name (case-insensitive partial match) */
async function findContactEmail(nameOrEmail: string): Promise<{ email: string; name: string } | null> {
    // If it already looks like an email, return it directly
    if (nameOrEmail.includes("@")) {
        return { email: nameOrEmail, name: nameOrEmail };
    }

    const db = await getDb();
    const contact = await db.collection("emergency_contacts").findOne({
        name: { $regex: nameOrEmail, $options: "i" },
    });

    if (contact?.email) {
        return { email: contact.email, name: contact.name };
    }
    return null;
}

/* ------------------------------------------------------------------ */
/*  Tools                                                              */
/* ------------------------------------------------------------------ */

export const getRecentEmails = tool({
    description: "Fetch the most recent emails from the user's inbox. Returns sender, subject, date, and a text preview.",
    parameters: z.object({
        count: z.number().default(5).describe("Number of emails to fetch"),
        folder: z.string().default("INBOX").describe("Mail folder to check"),
    }),
    execute: async ({ count, folder }) => {
        const client = getImapClient();
        try {
            await client.connect();
            const lock = await client.getMailboxLock(folder);

            try {
                const messages: any[] = [];
                const total = (client.mailbox && typeof client.mailbox === "object" && "exists" in client.mailbox) ? client.mailbox.exists : 0;
                if (total === 0) return { emails: [], message: "Inbox is empty." };

                const from = Math.max(1, total - count + 1);
                for await (const msg of client.fetch(`${from}:*`, {
                    envelope: true,
                    source: true,
                })) {
                    const parsed = await simpleParser(msg.source);
                    messages.push({
                        from: parsed.from?.text ?? "Unknown",
                        subject: parsed.subject ?? "(no subject)",
                        date: parsed.date?.toISOString() ?? "Unknown",
                        preview: (parsed.text ?? "").slice(0, 300),
                    });
                }

                return { emails: messages.reverse() };
            } finally {
                lock.release();
            }
        } catch (err: any) {
            return { error: `Email fetch failed: ${err.message}` };
        } finally {
            await client.logout().catch(() => {});
        }
    },
});

export const searchEmails = tool({
    description: "Search emails by keyword. Searches subject lines, sender names, and email body text. " + "Useful for finding bill-related emails, emails from specific people, or scam detection.",
    parameters: z.object({
        query: z.string().describe("Search term (e.g. 'bill', 'payment', 'invoice', 'pharmacy')"),
        count: z.number().default(10).describe("Max results to return"),
    }),
    execute: async ({ query, count }) => {
        const client = getImapClient();
        try {
            await client.connect();
            const lock = await client.getMailboxLock("INBOX");

            try {
                // Use TEXT search which searches entire message (headers + body)
                const uids = await client.search({ text: query });

                if (!uids || uids.length === 0) {
                    return { query, results: [], count: 0, message: `No emails found matching "${query}".` };
                }

                // Take the most recent ones (last N UIDs)
                const recentUids = uids.slice(-count);
                const results: any[] = [];

                for await (const msg of client.fetch(recentUids, {
                    envelope: true,
                    source: true,
                })) {
                    const parsed = await simpleParser(msg.source);
                    results.push({
                        from: parsed.from?.text ?? "Unknown",
                        subject: parsed.subject ?? "(no subject)",
                        date: parsed.date?.toISOString() ?? "Unknown",
                        preview: (parsed.text ?? "").slice(0, 300),
                    });
                }

                return {
                    query,
                    results: results.reverse(),
                    count: results.length,
                };
            } finally {
                lock.release();
            }
        } catch (err: any) {
            return { error: `Search failed: ${err.message}` };
        } finally {
            await client.logout().catch(() => {});
        }
    },
});

export const sendEmail = tool({
    description:
        "Send an email to a contact by their name or email address. " +
        "If a name is given (e.g. 'Sarah' or 'Dr. Smith'), the email address is looked up from the contacts database. " +
        "Always confirm with the user before sending.",
    parameters: z.object({
        to: z.string().describe("Recipient name (e.g. 'Sarah', 'David Johnson') or email address. " + "Names are looked up in the contacts database."),
        subject: z.string().describe("Email subject line"),
        body: z.string().describe("Email body text"),
    }),
    execute: async ({ to, subject, body }) => {
        try {
            // Resolve name → email from contacts DB
            const contact = await findContactEmail(to);

            if (!contact) {
                return {
                    success: false,
                    error: `Could not find an email address for "${to}". ` + "Please provide a full email address or add this person as a contact first.",
                };
            }

            const transport = getSmtpTransport();
            const info = await transport.sendMail({
                from: process.env.GMAIL_EMAIL,
                to: contact.email,
                subject,
                text: body,
            });

            return {
                success: true,
                message: `Email sent to ${contact.name} (${contact.email}) — subject: "${subject}"`,
                messageId: info.messageId,
            };
        } catch (err: any) {
            return { error: `Failed to send email: ${err.message}` };
        }
    },
});

export const emailTools = {
    getRecentEmails,
    searchEmails,
    sendEmail,
};
