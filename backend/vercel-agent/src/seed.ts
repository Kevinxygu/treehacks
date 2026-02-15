import "dotenv/config";
import { getDb, closeDb } from "./db.js";

async function seed() {
    const db = await getDb();

    const collections = ["medications", "medication_log", "emergency_contacts", "bill_reminders", "user_profile"];

    for (const name of collections) {
        const existing = await db.listCollections({ name }).toArray();
        if (existing.length > 0) {
            await db.collection(name).drop();
            console.log(`  Dropped: ${name}`);
        }
    }

    // --- User Profile ---
    await db.collection("user_profile").insertOne({
        name: "Margaret Johnson",
        email: "vs301vs@gmail.com",
        date_of_birth: "1945-03-15",
        allergies: "Penicillin, Shellfish",
        primary_doctor: "Dr. Robert Smith",
        pharmacy_name: "CVS Pharmacy",
        pharmacy_phone: "555-0199",
        address: "742 Evergreen Terrace, Springfield, IL 62704",
        notes: "Prefers morning appointments",
    });
    console.log("  Seeded: user_profile (1 doc)");

    // --- Medications ---
    await db.collection("medications").insertMany([
        {
            name: "Metformin",
            dosage: "500mg",
            frequency: "Twice daily",
            time_of_day: "8:00 AM, 8:00 PM",
            start_date: "2024-01-15",
            prescribing_doctor: "Dr. Smith",
            notes: "Take with food",
        },
        {
            name: "Lisinopril",
            dosage: "10mg",
            frequency: "Once daily",
            time_of_day: "8:00 AM",
            start_date: "2024-03-01",
            prescribing_doctor: "Dr. Smith",
            notes: "Blood pressure medication",
        },
        {
            name: "Atorvastatin",
            dosage: "20mg",
            frequency: "Once daily",
            time_of_day: "9:00 PM",
            start_date: "2024-03-01",
            prescribing_doctor: "Dr. Smith",
            notes: "Cholesterol - take at bedtime",
        },
        {
            name: "Vitamin D3",
            dosage: "2000 IU",
            frequency: "Once daily",
            time_of_day: "8:00 AM",
            start_date: "2024-06-01",
            prescribing_doctor: "Dr. Smith",
            notes: "Supplement",
        },
    ]);
    console.log("  Seeded: medications (4 docs)");

    // --- Emergency Contacts ---
    await db.collection("emergency_contacts").insertMany([
        {
            name: "Sarah Johnson",
            phone: "555-0101",
            email: "sarah.johnson@gmail.com",
            relation: "Daughter",
            is_primary: true,
        },
        {
            name: "Dr. Robert Smith",
            phone: "555-0202",
            email: "dr.smith@springfieldmed.com",
            relation: "Primary Care Physician",
            is_primary: false,
        },
        {
            name: "Mike Thompson",
            phone: "555-0303",
            email: "mike.thompson@gmail.com",
            relation: "Neighbor / Emergency Contact",
            is_primary: false,
        },
        {
            name: "David Johnson",
            phone: "555-0404",
            email: "david.johnson@gmail.com",
            relation: "Son",
            is_primary: false,
        },
    ]);
    console.log("  Seeded: emergency_contacts (4 docs)");

    // --- Bill Reminders ---
    await db.collection("bill_reminders").insertMany([
        {
            name: "Electric Bill",
            due_date: "2026-02-20",
            amount: 85.0,
            paid: false,
            recurrence: "monthly",
        },
        {
            name: "Medicare Part B",
            due_date: "2026-02-25",
            amount: 174.7,
            paid: false,
            recurrence: "monthly",
        },
        {
            name: "Phone Bill",
            due_date: "2026-03-01",
            amount: 45.0,
            paid: false,
            recurrence: "monthly",
        },
        {
            name: "Home Insurance",
            due_date: "2026-03-15",
            amount: 125.0,
            paid: false,
            recurrence: "quarterly",
        },
    ]);
    console.log("  Seeded: bill_reminders (4 docs)");

    await closeDb();
    console.log("\nDone! Database 'elder_care' is ready.");
}

seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
