import { MongoClient } from "mongodb";

export async function syncElderHealthData(elderId: string) {
  "use workflow";

  console.log("[syncElderHealthData] start elderId=", elderId);

  const sleep = await fetchWhoopSleep(elderId);
  console.log("[syncElderHealthData] fetchWhoopSleep count=", sleep.length);

  const cycle = await fetchWhoopCycle(elderId);
  console.log("[syncElderHealthData] fetchWhoopCycle count=", cycle.length);

  const recovery = await fetchWhoopRecovery(elderId);
  console.log("[syncElderHealthData] fetchWhoopRecovery count=", recovery.length);

  await storeHealthData(elderId, { sleep, cycle, recovery });
  console.log("[syncElderHealthData] storeHealthData done");

  const byStartDesc = <T extends { start?: string }>(a: T, b: T) =>
    (b.start ? new Date(b.start).getTime() : 0) - (a.start ? new Date(a.start).getTime() : 0);
  const byCreatedDesc = <T extends { created_at?: string }>(a: T, b: T) =>
    (b.created_at ? new Date(b.created_at).getTime() : 0) - (a.created_at ? new Date(a.created_at).getTime() : 0);
  const latestSleep = sleep.length ? [...sleep].sort(byStartDesc)[0]! : null;
  const latestRecovery = recovery.length ? [...recovery].sort(byCreatedDesc)[0]! : null;
  const latestCycle = cycle.length ? [...cycle].sort(byStartDesc)[0]! : null;
  const sleepScore = latestSleep?.score?.sleep_performance_percentage ?? null;
  const inBedMs = latestSleep?.score?.stage_summary?.total_in_bed_time_milli;
  const hoursInBed = inBedMs != null ? inBedMs / (1000 * 60 * 60) : undefined;
  const sn = latestSleep?.score?.sleep_needed;
  const needMs =
    sn != null
      ? (sn.baseline_milli ?? 0) +
        (sn.need_from_sleep_debt_milli ?? 0) +
        (sn.need_from_recent_strain_milli ?? 0) +
        (sn.need_from_recent_nap_milli ?? 0)
      : 0;
  const hoursNeeded = needMs > 0 ? needMs / (1000 * 60 * 60) : undefined;
  const sleepNeedScore =
    hoursInBed != null && hoursNeeded != null && hoursNeeded > 0
      ? Math.round((hoursInBed / hoursNeeded) * 100)
      : null;
  const recoveryScore = latestRecovery?.score?.recovery_score ?? null;
  const strain = latestCycle?.score?.strain ?? null;
  const strainPercent = strain != null ? Math.round((Number(strain) / 21) * 100) : null;

  const result = {
    elderId,
    sleepCount: sleep.length,
    cycleCount: cycle.length,
    recoveryCount: recovery.length,
    sleep,
    cycle,
    recovery,
    scores: {
      sleep: sleepScore,
      sleepNeedScore,
      sleepConsistency: latestSleep?.score?.sleep_consistency_percentage ?? null,
      sleepEfficiency: latestSleep?.score?.sleep_efficiency_percentage ?? null,
      recovery: recoveryScore,
      recoveryRestingHeartRate: latestRecovery?.score?.resting_heart_rate ?? null,
      recoveryHrvRmssdMilli: latestRecovery?.score?.hrv_rmssd_milli ?? null,
      recoverySpo2Percentage: latestRecovery?.score?.spo2_percentage ?? null,
      strainPercent,
      strainKilojoule: latestCycle?.score?.kilojoule ?? null,
      strainAverageHeartRate: latestCycle?.score?.average_heart_rate ?? null,
      strainMaxHeartRate: latestCycle?.score?.max_heart_rate ?? null,
    },
  };
  console.log("[syncElderHealthData] result", result);
  return result;
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
  return process.env.BACKEND_URL || "https://treehacks-backend-pi.vercel.app";
}

const backendBypassSecret =
  process.env.BACKEND_BYPASS_SECRET ||
  process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

function backendFetchHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (backendBypassSecret)
    headers["x-vercel-protection-bypass"] = backendBypassSecret;
  return headers;
}

async function fetchWhoopSleep(elderId: string): Promise<SleepRecord[]> {
  "use step";
  console.log("[fetchWhoopSleep] elderId=", elderId);
  const url = `${whoopBase()}/whoop/sleep/weekly`;
  const res = await fetch(url, { headers: backendFetchHeaders() });
  if (!res.ok) throw new Error(`whoop sleep fetch failed: ${res.status}`);
  const data = (await res.json()) as { records: SleepRecord[] };
  const records = data.records ?? [];
  console.log("[fetchWhoopSleep] count=", records.length);
  return records;
}

async function fetchWhoopCycle(elderId: string): Promise<CycleRecord[]> {
  "use step";
  console.log("[fetchWhoopCycle] elderId=", elderId);
  const url = `${whoopBase()}/whoop/cycle/weekly`;
  const res = await fetch(url, { headers: backendFetchHeaders() });
  if (!res.ok) throw new Error(`whoop cycle fetch failed: ${res.status}`);
  const data = (await res.json()) as { records: CycleRecord[] };
  const records = data.records ?? [];
  console.log("[fetchWhoopCycle] count=", records.length);
  return records;
}

async function fetchWhoopRecovery(elderId: string): Promise<RecoveryRecord[]> {
  "use step";
  console.log("[fetchWhoopRecovery] elderId=", elderId);
  const url = `${whoopBase()}/whoop/recovery/weekly`;
  const res = await fetch(url, { headers: backendFetchHeaders() });
  if (!res.ok) throw new Error(`whoop recovery fetch failed: ${res.status}`);
  const data = (await res.json()) as { records: RecoveryRecord[] };
  const records = data.records ?? [];
  console.log("[fetchWhoopRecovery] count=", records.length);
  return records;
}

interface SleepRecord {
  id?: string;
  cycle_id?: number;
  v1_id?: number;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
  start: string;
  end: string;
  timezone_offset?: string;
  nap?: boolean;
  score_state?: string;
  score?: {
    stage_summary?: {
      total_in_bed_time_milli?: number;
      total_awake_time_milli?: number;
      total_no_data_time_milli?: number;
      total_light_sleep_time_milli?: number;
      total_slow_wave_sleep_time_milli?: number;
      total_rem_sleep_time_milli?: number;
      sleep_cycle_count?: number;
      disturbance_count?: number;
    };
    sleep_needed?: {
      baseline_milli?: number;
      need_from_sleep_debt_milli?: number;
      need_from_recent_strain_milli?: number;
      need_from_recent_nap_milli?: number;
    };
    respiratory_rate?: number;
    sleep_performance_percentage?: number;
    sleep_consistency_percentage?: number;
    sleep_efficiency_percentage?: number;
  };
}

interface CycleRecord {
  id?: number;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
  start: string;
  end: string;
  timezone_offset?: string;
  score_state?: string;
  score?: {
    strain?: number;
    kilojoule?: number;
    average_heart_rate?: number;
    max_heart_rate?: number;
  };
}

interface RecoveryRecord {
  cycle_id?: number;
  sleep_id?: string;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
  score_state?: string;
  score?: {
    user_calibrating?: boolean;
    recovery_score?: number;
    resting_heart_rate?: number;
    hrv_rmssd_milli?: number;
    spo2_percentage?: number;
    skin_temp_celsius?: number;
  };
}
