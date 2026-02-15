import { MongoClient } from "mongodb";

export async function syncElderHealthData(elderId: string) {
  "use workflow";

  console.log("[syncElderHealthData] start elderId=", elderId);

  const since = await getLastSyncTimestamp(elderId);
  console.log("[syncElderHealthData] getLastSyncTimestamp since=", since);

  const sleep = await fetchWhoopSleep(elderId, since);
  console.log("[syncElderHealthData] fetchWhoopSleep count=", sleep.length);

  const cycle = await fetchWhoopCycle(elderId, since);
  console.log("[syncElderHealthData] fetchWhoopCycle count=", cycle.length);

  const recovery = await fetchWhoopRecovery(elderId, since);
  console.log("[syncElderHealthData] fetchWhoopRecovery count=", recovery.length);

  await storeHealthData(elderId, { sleep, cycle, recovery });
  console.log("[syncElderHealthData] storeHealthData done");

  const now = new Date().toISOString();
  await updateLastSyncTimestamp(elderId, now);
  console.log("[syncElderHealthData] updateLastSyncTimestamp now=", now);

  const result = { elderId, sleepCount: sleep.length, cycleCount: cycle.length, recoveryCount: recovery.length };
  console.log("[syncElderHealthData] result", result);
  return result;
}

async function getLastSyncTimestamp(elderId: string): Promise<string | null> {
  "use step";
  console.log("[getLastSyncTimestamp] elderId=", elderId);
  return null;
}

async function updateLastSyncTimestamp(elderId: string, isoTimestamp: string): Promise<void> {
  "use step";
  console.log("[updateLastSyncTimestamp] elderId=", elderId, "isoTimestamp=", isoTimestamp);
}

async function storeHealthData(
  elderId: string,
  payload: { sleep: SleepRecord[]; cycle: CycleRecord[]; recovery: RecoveryRecord[] }
): Promise<void> {
  "use step";
  const uri = process.env.MONGODB_CONNECTION_STRING;
  if (!uri) throw new Error("MONGODB_CONNECTION_STRING is not set");
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("elder_care");
    const coll = db.collection("whoop_data");
    const doc = {
      elderId,
      syncedAt: new Date().toISOString(),
      sleep: payload.sleep,
      cycle: payload.cycle,
      recovery: payload.recovery,
    };
    await coll.insertOne(doc);
    console.log("[storeHealthData] elderId=", elderId, "sleep=", payload.sleep.length, "cycle=", payload.cycle.length, "recovery=", payload.recovery.length);
  } finally {
    await client.close();
  }
}

function whoopBase(): string {
  return process.env.BACKEND_URL || "http://localhost:8000";
}

async function fetchWhoopSleep(elderId: string, _since: string | null): Promise<SleepRecord[]> {
  "use step";
  console.log("[fetchWhoopSleep] elderId=", elderId);
  const url = `${whoopBase()}/whoop/sleep/weekly`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`whoop sleep fetch failed: ${res.status}`);
  const data = (await res.json()) as { records: SleepRecord[] };
  const records = data.records ?? [];
  console.log("[fetchWhoopSleep] count=", records.length);
  return records;
}

async function fetchWhoopCycle(elderId: string, _since: string | null): Promise<CycleRecord[]> {
  "use step";
  console.log("[fetchWhoopCycle] elderId=", elderId);
  const url = `${whoopBase()}/whoop/cycle/weekly`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`whoop cycle fetch failed: ${res.status}`);
  const data = (await res.json()) as { records: CycleRecord[] };
  const records = data.records ?? [];
  console.log("[fetchWhoopCycle] count=", records.length);
  return records;
}

async function fetchWhoopRecovery(elderId: string, _since: string | null): Promise<RecoveryRecord[]> {
  "use step";
  console.log("[fetchWhoopRecovery] elderId=", elderId);
  const url = `${whoopBase()}/whoop/recovery/weekly`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`whoop recovery fetch failed: ${res.status}`);
  const data = (await res.json()) as { records: RecoveryRecord[] };
  const records = data.records ?? [];
  console.log("[fetchWhoopRecovery] count=", records.length);
  return records;
}

interface SleepRecord {
  date: string;
  performance_percent?: number;
  consistency_percent?: number;
  hours_in_bed: number;
}

interface CycleRecord {
  id?: number;
  date: string;
  strain?: number;
  kilojoule?: number;
  average_heart_rate?: number;
  max_heart_rate?: number;
  score_state?: string;
}

interface RecoveryRecord {
  cycle_id?: number;
  sleep_id?: string;
  created_at: string;
  score_state?: string;
  recovery_score?: number;
  resting_heart_rate?: number;
  hrv_rmssd_milli?: number;
  spo2_percentage?: number;
  skin_temp_celsius?: number;
  user_calibrating?: boolean;
}
