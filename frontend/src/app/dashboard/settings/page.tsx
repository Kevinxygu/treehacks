"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Pill, Users, Receipt, Save, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import { configApi, type UserProfile, type Medication, type EmergencyContact, type BillReminder } from "@/lib/config-api";

function Label({ children }: { children: React.ReactNode }) {
    return <label className="text-sm font-medium text-gray-600 mb-1 block">{children}</label>;
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
    return (
        <div className="space-y-1">
            <Label>{label}</Label>
            <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="bg-white border-gray-200" />
        </div>
    );
}

export default function SettingsPage() {
    const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
    const [medications, setMedications] = useState<Medication[]>([]);
    const [contacts, setContacts] = useState<EmergencyContact[]>([]);
    const [bills, setBills] = useState<BillReminder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState<string | null>(null);

    const [newMed, setNewMed] = useState<Partial<Medication>>({});
    const [newContact, setNewContact] = useState<Partial<EmergencyContact>>({});
    const [newBill, setNewBill] = useState<Partial<BillReminder>>({});
    const [editingMedId, setEditingMedId] = useState<string | null>(null);
    const [editingContactId, setEditingContactId] = useState<string | null>(null);
    const [editingBillId, setEditingBillId] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const [p, m, c, b] = await Promise.all([configApi.getProfile(), configApi.getMedications(), configApi.getEmergencyContacts(), configApi.getBillReminders()]);
            setProfile(p ?? null);
            setMedications(m ?? []);
            setContacts(c ?? []);
            setBills(b ?? []);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to load config");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function saveProfile() {
        if (!profile) return;
        setSaving("profile");
        try {
            const updated = await configApi.putProfile(profile);
            setProfile(updated);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to save profile");
        } finally {
            setSaving(null);
        }
    }

    async function addMedication() {
        if (!newMed.name) return;
        setSaving("med-add");
        try {
            const created = await configApi.postMedication(newMed);
            setMedications((prev) => [...prev, created]);
            setNewMed({});
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to add medication");
        } finally {
            setSaving(null);
        }
    }

    async function updateMedication(id: string, body: Partial<Medication>) {
        setSaving(`med-${id}`);
        try {
            const updated = await configApi.putMedication(id, body);
            setMedications((prev) => prev.map((m) => (m._id === id ? updated : m)));
            setEditingMedId(null);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to update medication");
        } finally {
            setSaving(null);
        }
    }

    async function deleteMedication(id: string) {
        if (!confirm("Remove this medication?")) return;
        setSaving(`med-del-${id}`);
        try {
            await configApi.deleteMedication(id);
            setMedications((prev) => prev.filter((m) => m._id !== id));
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to delete");
        } finally {
            setSaving(null);
        }
    }

    async function addContact() {
        if (!newContact.name || !newContact.phone) return;
        setSaving("contact-add");
        try {
            const created = await configApi.postEmergencyContact(newContact);
            setContacts((prev) => [...prev, created]);
            setNewContact({});
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to add contact");
        } finally {
            setSaving(null);
        }
    }

    async function updateContact(id: string, body: Partial<EmergencyContact>) {
        setSaving(`contact-${id}`);
        try {
            const updated = await configApi.putEmergencyContact(id, body);
            setContacts((prev) => prev.map((c) => (c._id === id ? updated : c)));
            setEditingContactId(null);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to update contact");
        } finally {
            setSaving(null);
        }
    }

    async function deleteContact(id: string) {
        if (!confirm("Remove this contact?")) return;
        setSaving(`contact-del-${id}`);
        try {
            await configApi.deleteEmergencyContact(id);
            setContacts((prev) => prev.filter((c) => c._id !== id));
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to delete");
        } finally {
            setSaving(null);
        }
    }

    async function addBill() {
        if (!newBill.name) return;
        setSaving("bill-add");
        try {
            const created = await configApi.postBillReminder(newBill);
            setBills((prev) => [...prev, created]);
            setNewBill({});
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to add bill");
        } finally {
            setSaving(null);
        }
    }

    async function updateBill(id: string, body: Partial<BillReminder>) {
        setSaving(`bill-${id}`);
        try {
            const updated = await configApi.putBillReminder(id, body);
            setBills((prev) => prev.map((b) => (b._id === id ? updated : b)));
            setEditingBillId(null);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to update bill");
        } finally {
            setSaving(null);
        }
    }

    async function deleteBill(id: string) {
        if (!confirm("Remove this bill reminder?")) return;
        setSaving(`bill-del-${id}`);
        try {
            await configApi.deleteBillReminder(id);
            setBills((prev) => prev.filter((b) => b._id !== id));
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to delete");
        } finally {
            setSaving(null);
        }
    }

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-care-blue" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Agent configuration</h1>
                <p className="text-sm text-gray-500 mt-1">Edit user profile, medications, emergency contacts, and bill reminders used by the voice agent.</p>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-800">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                    <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setError(null)}>
                        Dismiss
                    </Button>
                </div>
            )}

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="bg-muted p-1 rounded-lg">
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="w-4 h-4" />
                        User profile
                    </TabsTrigger>
                    <TabsTrigger value="medications" className="gap-2">
                        <Pill className="w-4 h-4" />
                        Medications
                    </TabsTrigger>
                    <TabsTrigger value="contacts" className="gap-2">
                        <Users className="w-4 h-4" />
                        Emergency contacts
                    </TabsTrigger>
                    <TabsTrigger value="bills" className="gap-2">
                        <Receipt className="w-4 h-4" />
                        Bill reminders
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-0">
                    <Card className="border-0 shadow-sm bg-white">
                        <CardHeader>
                            <CardTitle className="text-lg">User profile</CardTitle>
                            <p className="text-sm text-gray-500">This profile is used by the agent to personalize conversations.</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Name" value={profile?.name ?? ""} onChange={(v) => setProfile((p) => ({ ...p, name: v }))} placeholder="Full name" />
                                <Field label="Email" value={profile?.email ?? ""} onChange={(v) => setProfile((p) => ({ ...p, email: v }))} placeholder="email@example.com" type="email" />
                                <Field label="Date of birth" value={profile?.date_of_birth ?? ""} onChange={(v) => setProfile((p) => ({ ...p, date_of_birth: v }))} placeholder="YYYY-MM-DD" />
                                <Field label="Allergies" value={profile?.allergies ?? ""} onChange={(v) => setProfile((p) => ({ ...p, allergies: v }))} placeholder="e.g. Penicillin, Shellfish" />
                                <Field label="Primary doctor" value={profile?.primary_doctor ?? ""} onChange={(v) => setProfile((p) => ({ ...p, primary_doctor: v }))} />
                                <Field label="Pharmacy name" value={profile?.pharmacy_name ?? ""} onChange={(v) => setProfile((p) => ({ ...p, pharmacy_name: v }))} />
                                <Field label="Pharmacy phone" value={profile?.pharmacy_phone ?? ""} onChange={(v) => setProfile((p) => ({ ...p, pharmacy_phone: v }))} placeholder="555-0199" />
                            </div>
                            <Field label="Address" value={profile?.address ?? ""} onChange={(v) => setProfile((p) => ({ ...p, address: v }))} placeholder="Street, City, State ZIP" />
                            <Field label="Notes" value={profile?.notes ?? ""} onChange={(v) => setProfile((p) => ({ ...p, notes: v }))} placeholder="e.g. Prefers morning appointments" />
                            <Button onClick={saveProfile} disabled={saving === "profile"} className="bg-care-blue hover:bg-care-blue/90 text-white gap-2">
                                {saving === "profile" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save profile
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="medications" className="mt-0 space-y-4">
                    <Card className="border-0 shadow-sm bg-white">
                        <CardHeader>
                            <CardTitle className="text-lg">Medication schedule</CardTitle>
                            <p className="text-sm text-gray-500">Medications and times the agent uses for reminders.</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Add new */}
                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-3">
                                <p className="text-sm font-medium text-gray-700">Add medication</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Input placeholder="Name (e.g. Metformin)" value={newMed.name ?? ""} onChange={(e) => setNewMed((m) => ({ ...m, name: e.target.value }))} className="bg-white" />
                                    <Input placeholder="Dosage (e.g. 500mg)" value={newMed.dosage ?? ""} onChange={(e) => setNewMed((m) => ({ ...m, dosage: e.target.value }))} className="bg-white" />
                                    <Input
                                        placeholder="Frequency (e.g. Twice daily)"
                                        value={newMed.frequency ?? ""}
                                        onChange={(e) => setNewMed((m) => ({ ...m, frequency: e.target.value }))}
                                        className="bg-white"
                                    />
                                    <Input
                                        placeholder="Time of day (e.g. 8:00 AM, 8:00 PM)"
                                        value={newMed.time_of_day ?? ""}
                                        onChange={(e) => setNewMed((m) => ({ ...m, time_of_day: e.target.value }))}
                                        className="bg-white"
                                    />
                                    <Input
                                        placeholder="Prescribing doctor"
                                        value={newMed.prescribing_doctor ?? ""}
                                        onChange={(e) => setNewMed((m) => ({ ...m, prescribing_doctor: e.target.value }))}
                                        className="bg-white md:col-span-2"
                                    />
                                    <Input
                                        placeholder="Notes (e.g. Take with food)"
                                        value={newMed.notes ?? ""}
                                        onChange={(e) => setNewMed((m) => ({ ...m, notes: e.target.value }))}
                                        className="bg-white md:col-span-2"
                                    />
                                </div>
                                <Button size="sm" onClick={addMedication} disabled={saving === "med-add" || !newMed.name} className="gap-1 bg-care-blue hover:bg-care-blue/90 text-white">
                                    {saving === "med-add" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Add
                                </Button>
                            </div>

                            {/* List */}
                            <div className="space-y-2">
                                {medications.map((m) =>
                                    editingMedId === m._id ? (
                                        <MedicationEditForm
                                            key={m._id}
                                            med={m}
                                            onSave={(body) => updateMedication(m._id, body)}
                                            onCancel={() => setEditingMedId(null)}
                                            saving={saving === `med-${m._id}`}
                                        />
                                    ) : (
                                        <div key={m._id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50/50">
                                            <div>
                                                <p className="font-medium text-gray-900">{m.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {m.dosage} · {m.frequency} · {m.time_of_day}
                                                </p>
                                                {m.notes && <p className="text-xs text-gray-400 mt-0.5">{m.notes}</p>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" onClick={() => setEditingMedId(m._id)} disabled={!!saving}>
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => deleteMedication(m._id)}
                                                    disabled={!!saving}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ),
                                )}
                                {medications.length === 0 && <p className="text-sm text-gray-400 py-4">No medications yet. Add one above.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="contacts" className="mt-0 space-y-4">
                    <Card className="border-0 shadow-sm bg-white">
                        <CardHeader>
                            <CardTitle className="text-lg">Emergency contacts</CardTitle>
                            <p className="text-sm text-gray-500">Contacts the agent can reference or use for notifications.</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-3">
                                <p className="text-sm font-medium text-gray-700">Add contact</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Input placeholder="Name" value={newContact.name ?? ""} onChange={(e) => setNewContact((c) => ({ ...c, name: e.target.value }))} className="bg-white" />
                                    <Input placeholder="Phone" value={newContact.phone ?? ""} onChange={(e) => setNewContact((c) => ({ ...c, phone: e.target.value }))} className="bg-white" />
                                    <Input placeholder="Email" value={newContact.email ?? ""} onChange={(e) => setNewContact((c) => ({ ...c, email: e.target.value }))} className="bg-white" />
                                    <Input
                                        placeholder="Relation (e.g. Daughter)"
                                        value={newContact.relation ?? ""}
                                        onChange={(e) => setNewContact((c) => ({ ...c, relation: e.target.value }))}
                                        className="bg-white"
                                    />
                                    <label className="flex items-center gap-2 text-sm text-gray-600 md:col-span-2">
                                        <input
                                            type="checkbox"
                                            checked={!!newContact.is_primary}
                                            onChange={(e) => setNewContact((c) => ({ ...c, is_primary: e.target.checked }))}
                                            className="rounded border-gray-300"
                                        />
                                        Primary emergency contact
                                    </label>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={addContact}
                                    disabled={saving === "contact-add" || !newContact.name || !newContact.phone}
                                    className="gap-1 bg-care-blue hover:bg-care-blue/90 text-white"
                                >
                                    {saving === "contact-add" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Add contact
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {contacts.map((c) =>
                                    editingContactId === c._id ? (
                                        <ContactEditForm
                                            key={c._id}
                                            contact={c}
                                            onSave={(body) => updateContact(c._id, body)}
                                            onCancel={() => setEditingContactId(null)}
                                            saving={saving === `contact-${c._id}`}
                                        />
                                    ) : (
                                        <div key={c._id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50/50">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-gray-900">{c.name}</p>
                                                    {c.is_primary && <Badge className="bg-care-blue/10 text-care-blue border-0 text-xs">Primary</Badge>}
                                                </div>
                                                <p className="text-sm text-gray-500">{c.relation}</p>
                                                <p className="text-sm text-gray-500">{c.phone}</p>
                                                {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" onClick={() => setEditingContactId(c._id)} disabled={!!saving}>
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => deleteContact(c._id)}
                                                    disabled={!!saving}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ),
                                )}
                                {contacts.length === 0 && <p className="text-sm text-gray-400 py-4">No contacts yet. Add one above.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="bills" className="mt-0 space-y-4">
                    <Card className="border-0 shadow-sm bg-white">
                        <CardHeader>
                            <CardTitle className="text-lg">Bill reminders</CardTitle>
                            <p className="text-sm text-gray-500">Bills the agent can remind about.</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-3">
                                <p className="text-sm font-medium text-gray-700">Add bill</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Input
                                        placeholder="Name (e.g. Electric Bill)"
                                        value={newBill.name ?? ""}
                                        onChange={(e) => setNewBill((b) => ({ ...b, name: e.target.value }))}
                                        className="bg-white"
                                    />
                                    <Input
                                        placeholder="Due date (YYYY-MM-DD)"
                                        value={newBill.due_date ?? ""}
                                        onChange={(e) => setNewBill((b) => ({ ...b, due_date: e.target.value }))}
                                        className="bg-white"
                                    />
                                    <Input
                                        placeholder="Amount"
                                        type="number"
                                        value={newBill.amount ?? ""}
                                        onChange={(e) => setNewBill((b) => ({ ...b, amount: parseFloat(e.target.value) || 0 }))}
                                        className="bg-white"
                                    />
                                    <Input
                                        placeholder="Recurrence (monthly, quarterly)"
                                        value={newBill.recurrence ?? ""}
                                        onChange={(e) => setNewBill((b) => ({ ...b, recurrence: e.target.value }))}
                                        className="bg-white"
                                    />
                                </div>
                                <Button size="sm" onClick={addBill} disabled={saving === "bill-add" || !newBill.name} className="gap-1 bg-care-blue hover:bg-care-blue/90 text-white">
                                    {saving === "bill-add" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Add bill
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {bills.map((b) =>
                                    editingBillId === b._id ? (
                                        <BillEditForm key={b._id} bill={b} onSave={(body) => updateBill(b._id, body)} onCancel={() => setEditingBillId(null)} saving={saving === `bill-${b._id}`} />
                                    ) : (
                                        <div key={b._id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50/50">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-gray-900">{b.name}</p>
                                                    {b.paid && <Badge className="bg-alert-green/10 text-alert-green border-0 text-xs">Paid</Badge>}
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    Due {b.due_date} · ${b.amount.toFixed(2)} · {b.recurrence}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" onClick={() => setEditingBillId(b._id)} disabled={!!saving}>
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => deleteBill(b._id)}
                                                    disabled={!!saving}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ),
                                )}
                                {bills.length === 0 && <p className="text-sm text-gray-400 py-4">No bill reminders yet. Add one above.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function MedicationEditForm({ med, onSave, onCancel, saving }: { med: Medication; onSave: (body: Partial<Medication>) => void; onCancel: () => void; saving: boolean }) {
    const [name, setName] = useState(med.name);
    const [dosage, setDosage] = useState(med.dosage);
    const [frequency, setFrequency] = useState(med.frequency);
    const [time_of_day, setTimeOfDay] = useState(med.time_of_day);
    const [prescribing_doctor, setPrescribingDoctor] = useState(med.prescribing_doctor ?? "");
    const [notes, setNotes] = useState(med.notes ?? "");

    return (
        <div className="p-4 rounded-xl border border-care-blue/30 bg-care-blue/5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="bg-white" />
                <Input placeholder="Dosage" value={dosage} onChange={(e) => setDosage(e.target.value)} className="bg-white" />
                <Input placeholder="Frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)} className="bg-white" />
                <Input placeholder="Time of day" value={time_of_day} onChange={(e) => setTimeOfDay(e.target.value)} className="bg-white" />
                <Input placeholder="Prescribing doctor" value={prescribing_doctor} onChange={(e) => setPrescribingDoctor(e.target.value)} className="bg-white md:col-span-2" />
                <Input placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-white md:col-span-2" />
            </div>
            <div className="flex gap-2">
                <Button
                    size="sm"
                    onClick={() => onSave({ name, dosage, frequency, time_of_day, prescribing_doctor, notes })}
                    disabled={saving}
                    className="gap-1 bg-care-blue hover:bg-care-blue/90 text-white"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                </Button>
                <Button size="sm" variant="outline" onClick={onCancel} disabled={saving}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}

function ContactEditForm({ contact, onSave, onCancel, saving }: { contact: EmergencyContact; onSave: (body: Partial<EmergencyContact>) => void; onCancel: () => void; saving: boolean }) {
    const [name, setName] = useState(contact.name);
    const [phone, setPhone] = useState(contact.phone);
    const [email, setEmail] = useState(contact.email ?? "");
    const [relation, setRelation] = useState(contact.relation);
    const [is_primary, setIsPrimary] = useState(contact.is_primary);

    return (
        <div className="p-4 rounded-xl border border-care-blue/30 bg-care-blue/5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="bg-white" />
                <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-white" />
                <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white" />
                <Input placeholder="Relation" value={relation} onChange={(e) => setRelation(e.target.value)} className="bg-white" />
                <label className="flex items-center gap-2 text-sm text-gray-600 md:col-span-2">
                    <input type="checkbox" checked={is_primary} onChange={(e) => setIsPrimary(e.target.checked)} className="rounded border-gray-300" />
                    Primary emergency contact
                </label>
            </div>
            <div className="flex gap-2">
                <Button size="sm" onClick={() => onSave({ name, phone, email, relation, is_primary })} disabled={saving} className="gap-1 bg-care-blue hover:bg-care-blue/90 text-white">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                </Button>
                <Button size="sm" variant="outline" onClick={onCancel} disabled={saving}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}

function BillEditForm({ bill, onSave, onCancel, saving }: { bill: BillReminder; onSave: (body: Partial<BillReminder>) => void; onCancel: () => void; saving: boolean }) {
    const [name, setName] = useState(bill.name);
    const [due_date, setDueDate] = useState(bill.due_date);
    const [amount, setAmount] = useState(String(bill.amount));
    const [paid, setPaid] = useState(bill.paid);
    const [recurrence, setRecurrence] = useState(bill.recurrence);

    return (
        <div className="p-4 rounded-xl border border-care-blue/30 bg-care-blue/5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="bg-white" />
                <Input placeholder="Due date (YYYY-MM-DD)" value={due_date} onChange={(e) => setDueDate(e.target.value)} className="bg-white" />
                <Input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-white" />
                <Input placeholder="Recurrence" value={recurrence} onChange={(e) => setRecurrence(e.target.value)} className="bg-white" />
                <label className="flex items-center gap-2 text-sm text-gray-600 md:col-span-2">
                    <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="rounded border-gray-300" />
                    Paid
                </label>
            </div>
            <div className="flex gap-2">
                <Button
                    size="sm"
                    onClick={() => onSave({ name, due_date, amount: parseFloat(amount) || 0, paid, recurrence })}
                    disabled={saving}
                    className="gap-1 bg-care-blue hover:bg-care-blue/90 text-white"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                </Button>
                <Button size="sm" variant="outline" onClick={onCancel} disabled={saving}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}
