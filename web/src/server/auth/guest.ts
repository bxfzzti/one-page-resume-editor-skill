import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull, lt, or, sql as drizzleSql } from "drizzle-orm";
import { db, type ResumeDb, type ResumeTransaction } from "@/db/client";
import {
  guestUsage,
  pointLedger,
  resumeProjects,
  sessions,
  sourceFiles,
  users,
} from "@/db/schema";
import { PointLedgerService } from "@/server/points/point-ledger";
import { getStorageAdapter } from "@/server/storage/storage";
import {
  GUEST_DAILY_RUN_LIMIT,
  GUEST_DATA_TTL_MS,
  isAnonymousPreviewEnabled,
} from "@/server/config/mode";
import { hashSessionToken } from "./otp";

function usageDay(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function getGuestFingerprintHash(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address =
    request.headers.get("cf-connecting-ip") ||
    forwarded ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const agent = request.headers.get("user-agent") || "unknown";
  const secret = process.env.SESSION_SECRET ?? "local-development-session-secret-32-bytes";
  return createHash("sha256")
    .update(`${secret}:guest-fingerprint:${address}:${agent}`)
    .digest("hex");
}

export async function cleanupExpiredGuests(database: ResumeDb = db, now = new Date()) {
  const expired = await database
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.isAnonymous, true),
        lt(users.anonymousExpiresAt, now),
        isNull(users.deletedAt),
      ),
    );
  await database.delete(guestUsage).where(lt(guestUsage.usageDay, usageDay(now)));
  if (expired.length === 0) return;

  const storage = getStorageAdapter();
  for (const user of expired) {
    const files = await database
      .select({ storageKey: sourceFiles.storageKey })
      .from(sourceFiles)
      .innerJoin(resumeProjects, eq(sourceFiles.resumeProjectId, resumeProjects.id))
      .where(eq(resumeProjects.userId, user.id));
    await Promise.all(files.map((file) => storage.delete(file.storageKey)));
    await database.delete(pointLedger).where(eq(pointLedger.userId, user.id));
    await database.delete(users).where(and(eq(users.id, user.id), eq(users.isAnonymous, true)));
  }
}

export async function createGuestSession(request: Request, database: ResumeDb = db) {
  if (!isAnonymousPreviewEnabled()) throw new Error("PREVIEW_MODE_DISABLED");
  await cleanupExpiredGuests(database);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + GUEST_DATA_TTL_MS);
  const sessionToken = randomBytes(32).toString("base64url");
  const [user] = await database.transaction(async (tx) => {
    const [created] = await tx
      .insert(users)
      .values({ isAnonymous: true, anonymousExpiresAt: expiresAt })
      .returning();
    await new PointLedgerService(database).grantWelcomeInTransaction(tx, created.id);
    await tx.insert(sessions).values({
      userId: created.id,
      tokenHash: hashSessionToken(sessionToken),
      expiresAt,
    });
    return [created];
  });

  return {
    user,
    sessionToken,
    expiresAt,
    remaining: await getGuestRemaining(user.id, getGuestFingerprintHash(request), database),
  };
}

export async function consumeGuestQuota(
  userId: string,
  request: Request,
  database: ResumeDb = db,
) {
  const day = usageDay();
  const scopes = [`guest:${userId}`, `ip:${getGuestFingerprintHash(request)}`];
  return database.transaction(async (tx) => {
    await tx.execute(
      drizzleSql`select pg_advisory_xact_lock(hashtext(${`guest-quota:${scopes.join(":")}:${day}`}))`,
    );
    const rows = await tx
      .select()
      .from(guestUsage)
      .where(and(eq(guestUsage.usageDay, day), or(...scopes.map((scope) => eq(guestUsage.scopeKey, scope)))));
    if (rows.some((row) => row.runCount >= GUEST_DAILY_RUN_LIMIT)) {
      throw new Error("GUEST_QUOTA_EXHAUSTED");
    }
    for (const scopeKey of scopes) {
      await upsertUsage(tx, scopeKey, day);
    }
    return { remaining: GUEST_DAILY_RUN_LIMIT - Math.max(...rows.map((row) => row.runCount), 0) - 1 };
  });
}

export async function releaseGuestQuota(
  userId: string,
  request: Request,
  database: ResumeDb = db,
) {
  const day = usageDay();
  const scopes = [`guest:${userId}`, `ip:${getGuestFingerprintHash(request)}`];
  await database.transaction(async (tx) => {
    await tx.execute(
      drizzleSql`select pg_advisory_xact_lock(hashtext(${`guest-quota:${scopes.join(":")}:${day}`}))`,
    );
    for (const scopeKey of scopes) {
      await tx
        .update(guestUsage)
        .set({ runCount: sqlMaxZero(guestUsage.runCount) })
        .where(and(eq(guestUsage.scopeKey, scopeKey), eq(guestUsage.usageDay, day)));
    }
  });
}

export async function getGuestRemaining(
  userId: string,
  requestFingerprint: string,
  database: ResumeDb = db,
) {
  const rows = await database
    .select({ runCount: guestUsage.runCount })
    .from(guestUsage)
    .where(
      and(
        eq(guestUsage.usageDay, usageDay()),
        or(
          eq(guestUsage.scopeKey, `guest:${userId}`),
          eq(guestUsage.scopeKey, `ip:${requestFingerprint}`),
        ),
      ),
    );
  return Math.max(0, GUEST_DAILY_RUN_LIMIT - Math.max(...rows.map((row) => row.runCount), 0));
}

async function upsertUsage(tx: ResumeTransaction, scopeKey: string, day: string) {
  await tx
    .insert(guestUsage)
    .values({ scopeKey, usageDay: day, runCount: 1 })
    .onConflictDoUpdate({
      target: [guestUsage.scopeKey, guestUsage.usageDay],
      set: { runCount: drizzleSql`${guestUsage.runCount} + 1` },
    });
}

function sqlMaxZero(column: typeof guestUsage.runCount) {
  return drizzleSql`greatest(${column} - 1, 0)`;
}
