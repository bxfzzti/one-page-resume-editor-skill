import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { serviceRuns } from "@/db/schema";
import { processServiceRun } from "./process-service-run";

export async function processOneQueuedRun() {
  const [run] = await db
    .select({ id: serviceRuns.id })
    .from(serviceRuns)
    .where(eq(serviceRuns.state, "reserved"))
    .orderBy(asc(serviceRuns.createdAt))
    .limit(1);
  if (!run) return null;
  return processServiceRun(run.id);
}

if (process.argv.includes("--once")) {
  await processOneQueuedRun();
  process.exit(0);
}

while (true) {
  await processOneQueuedRun();
  await new Promise((resolve) => setTimeout(resolve, 1_000));
}
