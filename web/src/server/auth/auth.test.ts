import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/client";
import {
  emailOtps,
  paymentOrders,
  pointLedger,
  sessions,
  users,
} from "@/db/schema";
import { PointLedgerService } from "@/server/points/point-ledger";
import { AuthService } from "./otp";

const ledger = new PointLedgerService(db);
const auth = new AuthService(db, ledger, "test-session-secret-with-32-bytes");

describe("AuthService", () => {
  beforeEach(async () => {
    await db.delete(sessions);
    await db.delete(emailOtps);
    await db.delete(pointLedger);
    await db.delete(paymentOrders);
    await db.delete(users);
  });

  it("creates a user and grants 50 points after first verification", async () => {
    const { code } = await auth.requestEmailCode("USER@example.com");
    const result = await auth.verifyEmailCode("user@example.com", code);

    expect(result.user.email).toBe("user@example.com");
    expect(result.sessionToken.length).toBeGreaterThan(32);
    expect(await ledger.getBalance(result.user.id)).toEqual({
      available: 50,
      reserved: 0,
    });
  });

  it("does not grant another welcome reward on later logins", async () => {
    const firstCode = await auth.requestEmailCode("user@example.com");
    const first = await auth.verifyEmailCode("user@example.com", firstCode.code);
    const secondCode = await auth.requestEmailCode("user@example.com", {
      skipCooldown: true,
    });
    await auth.verifyEmailCode("user@example.com", secondCode.code);

    expect(await ledger.getBalance(first.user.id)).toEqual({
      available: 50,
      reserved: 0,
    });
  });

  it("consumes a code after successful verification", async () => {
    const { code } = await auth.requestEmailCode("user@example.com");
    await auth.verifyEmailCode("user@example.com", code);

    await expect(
      auth.verifyEmailCode("user@example.com", code),
    ).rejects.toThrow("INVALID_OR_EXPIRED_CODE");
  });

  it("removes an OTP when email delivery fails", async () => {
    const failingAuth = new AuthService(
      db,
      ledger,
      "test-session-secret-with-32-bytes",
      {
        async sendVerificationCode() {
          throw new Error("mail unavailable");
        },
      },
    );

    await expect(
      failingAuth.requestEmailCode("user@example.com"),
    ).rejects.toThrow("OTP_DELIVERY_FAILED");
    expect(await db.select().from(emailOtps)).toHaveLength(0);
  });
});
