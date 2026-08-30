import { beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  guestUsage,
  paymentOrders,
  pointLedger,
  sessions,
  users,
} from "@/db/schema";
import {
  consumeGuestQuota,
  createGuestSession,
  getGuestFingerprintHash,
  getGuestRemaining,
} from "./guest";

function request(ip: string, agent = "guest-test") {
  return new Request("http://localhost", {
    headers: {
      "user-agent": agent,
      "x-forwarded-for": ip,
    },
  });
}

describe("anonymous preview sessions", () => {
  beforeEach(async () => {
    await db.delete(guestUsage);
    await db.delete(sessions);
    await db.delete(pointLedger);
    await db.delete(paymentOrders);
    await db.delete(users);
  });

  it("creates a temporary guest with internal test points", async () => {
    const result = await createGuestSession(request("192.0.2.10"));

    expect(result.user.isAnonymous).toBe(true);
    expect(result.user.email).toBeNull();
    expect(result.user.phone).toBeNull();
    expect(result.remaining).toBe(3);
  });

  it("limits the same source even after a new guest session", async () => {
    const first = await createGuestSession(request("192.0.2.11"));
    for (let index = 0; index < 3; index += 1) {
      await consumeGuestQuota(first.user.id, request("192.0.2.11"));
    }

    const second = await createGuestSession(request("192.0.2.11"));
    await expect(
      consumeGuestQuota(second.user.id, request("192.0.2.11")),
    ).rejects.toThrow("GUEST_QUOTA_EXHAUSTED");
  });

  it("reports the lower remaining quota across guest and source scopes", async () => {
    const result = await createGuestSession(request("192.0.2.12"));
    await consumeGuestQuota(result.user.id, request("192.0.2.12"));

    expect(
      await getGuestRemaining(
        result.user.id,
        getGuestFingerprintHash(request("192.0.2.12")),
      ),
    ).toBe(2);
  });

  it("does not delete a live phone user during guest cleanup", async () => {
    const [phoneUser] = await db
      .insert(users)
      .values({ phone: "13900139000", phoneVerifiedAt: new Date() })
      .returning();
    await createGuestSession(request("192.0.2.13"));

    const [stillThere] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, phoneUser.id), eq(users.phone, "13900139000")));
    expect(stillThere).toBeDefined();
  });

  it("deletes an expired anonymous user when preview traffic resumes", async () => {
    const [expired] = await db
      .insert(users)
      .values({
        isAnonymous: true,
        anonymousExpiresAt: new Date(Date.now() - 1_000),
      })
      .returning();

    await createGuestSession(request("192.0.2.14"));

    const [removed] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, expired.id));
    expect(removed).toBeUndefined();
  });
});
