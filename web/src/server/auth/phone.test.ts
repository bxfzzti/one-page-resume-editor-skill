import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/client";
import {
  emailOtps,
  paymentOrders,
  phoneOtps,
  pointLedger,
  sessions,
  users,
} from "@/db/schema";
import { PointLedgerService } from "@/server/points/point-ledger";
import { PhoneAuthService } from "./phone";

const ledger = new PointLedgerService(db);
const auth = new PhoneAuthService(
  db,
  ledger,
  "test-session-secret-with-32-bytes",
  { async sendVerificationCode() {} },
);

describe("PhoneAuthService", () => {
  beforeEach(async () => {
    await db.delete(sessions);
    await db.delete(phoneOtps);
    await db.delete(emailOtps);
    await db.delete(pointLedger);
    await db.delete(paymentOrders);
    await db.delete(users);
  });

  it("creates a phone user and grants 50 points after first verification", async () => {
    const { code } = await auth.requestPhoneCode("13800138000");
    const result = await auth.verifyPhoneCode("13800138000", code);

    expect(result.user.phone).toBe("13800138000");
    expect(result.user.email).toBeNull();
    expect(result.user.phoneVerifiedAt).toBeInstanceOf(Date);
    expect(result.sessionToken.length).toBeGreaterThan(32);
    expect(await ledger.getBalance(result.user.id)).toEqual({
      available: 50,
      reserved: 0,
    });
  });

  it("does not grant another welcome reward on later logins", async () => {
    const firstCode = await auth.requestPhoneCode("13800138000");
    const first = await auth.verifyPhoneCode("13800138000", firstCode.code);
    const secondCode = await auth.requestPhoneCode("13800138000", {
      skipCooldown: true,
    });
    await auth.verifyPhoneCode("13800138000", secondCode.code);

    expect(await ledger.getBalance(first.user.id)).toEqual({
      available: 50,
      reserved: 0,
    });
  });

  it("consumes a code after successful verification", async () => {
    const { code } = await auth.requestPhoneCode("13800138000");
    await auth.verifyPhoneCode("13800138000", code);

    await expect(
      auth.verifyPhoneCode("13800138000", code),
    ).rejects.toThrow("INVALID_OR_EXPIRED_CODE");
  });

  it("removes an OTP when SMS delivery fails", async () => {
    const failingAuth = new PhoneAuthService(
      db,
      ledger,
      "test-session-secret-with-32-bytes",
      {
        async sendVerificationCode() {
          throw new Error("sms unavailable");
        },
      },
    );

    await expect(
      failingAuth.requestPhoneCode("13800138000"),
    ).rejects.toThrow("OTP_DELIVERY_FAILED");
    expect(await db.select().from(phoneOtps)).toHaveLength(0);
  });
});
