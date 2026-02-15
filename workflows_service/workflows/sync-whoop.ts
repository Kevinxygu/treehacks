export async function syncElderHealthData(elderId: string) {
  "use workflow";

  const sleep = await fetchWhoopSleep(elderId);

  return { elderId, sleepCount: sleep.length };
}

async function fetchWhoopSleep(elderId: string): Promise<SleepRecord[]> {
  "use step";

  const base = process.env.BACKEND_URL || "http://localhost:8000";
  const url = `${base}/whoop/sleep/weekly`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`whoop sleep fetch failed: ${res.status}`);
  const data = (await res.json()) as { records: SleepRecord[] };
  const records = data.records ?? [];
  console.log("[fetchWhoopSleep] elderId=", elderId, "count=", records.length, "records=", JSON.stringify(records));
  return records;
}

interface SleepRecord {
  date: string;
  performance_percent?: number;
  consistency_percent?: number;
  hours_in_bed: number;
}
