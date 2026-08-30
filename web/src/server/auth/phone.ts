import { createHash, randomBytes, randomInt } from "node:crypto";
import { and, desc, eq, gt, gte, isNull, sql as drizzleSql } from "drizzle-orm";
import { z } from "zod";
import { db, type ResumeDb } from "@/db/client";
import { phoneOtps, sessions, users } from "@/db/schema";
import { PointLedgerService } from "@/server/points/point-ledger";
import { createVerificationSmsSender, type VerificationSmsSender } from "./sms-sender";

const phoneSchema = z.string().trim().regex(/^1[3-9]\d{9}$/, "INVALID_PHONE");

function digest(secret: string, ...values: string[]) {
  return createHash("sha256").update([secret, ...values].join(":")).digest("hex");
}

export class PhoneAuthService {
  constructor(
    private readonly database: ResumeDb = db,
    private readonly ledger = new PointLedgerService(database),
    private readonly secret = process.env.SESSION_SECRET ?? "local-development-session-secret-32-bytes",
    private readonly smsSender: VerificationSmsSender = createVerificationSmsSender(),
  ) {
    if (this.secret.length < 32) throw new Error("SESSION_SECRET_TOO_SHORT");
  }

  async requestPhoneCode(inputPhone: string, options: { skipCooldown?: boolean } = {}) {
    const phone = phoneSchema.parse(inputPhone);
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1_000);
    const recent = await this.database
      .select({ createdAt: phoneOtps.createdAt })
      .from(phoneOtps)
      .where(and(eq(phoneOtps.phone, phone), gte(phoneOtps.createdAt, fifteenMinutesAgo)))
      .orderBy(desc(phoneOtps.createdAt));
    if (recent.length >= 5) throw new Error("OTP_RATE_LIMITED");
    if (!options.skipCooldown && recent[0] && now.getTime() - recent[0].createdAt.getTime() < 60_000) {
      throw new Error("OTP_COOLDOWN_ACTIVE");
    }
    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1_000);
    const [otp] = await this.database.insert(phoneOtps).values({ phone, codeHash: digest(this.secret, phone, code), expiresAt }).returning({ id: phoneOtps.id });
    try {
      await this.smsSender.sendVerificationCode({ phone, code, expiresAt });
    } catch {
      await this.database.delete(phoneOtps).where(eq(phoneOtps.id, otp.id));
      throw new Error("OTP_DELIVERY_FAILED");
    }
    return { code, expiresAt };
  }

  async verifyPhoneCode(inputPhone: string, code: string) {
    const phone = phoneSchema.parse(inputPhone);
    if (!/^\d{6}$/.test(code)) throw new Error("INVALID_OR_EXPIRED_CODE");
    const codeHash = digest(this.secret, phone, code);
    return this.database.transaction(async (tx) => {
      await tx.execute(drizzleSql`select pg_advisory_xact_lock(hashtext(${phone}))`);
      const [otp] = await tx.select().from(phoneOtps).where(and(eq(phoneOtps.phone, phone), eq(phoneOtps.codeHash, codeHash), isNull(phoneOtps.consumedAt), gt(phoneOtps.expiresAt, new Date()))).orderBy(desc(phoneOtps.createdAt)).limit(1);
      if (!otp) throw new Error("INVALID_OR_EXPIRED_CODE");
      await tx.update(phoneOtps).set({ consumedAt: new Date() }).where(and(eq(phoneOtps.id, otp.id), isNull(phoneOtps.consumedAt)));
      let [user] = await tx.select().from(users).where(eq(users.phone, phone));
      if (user?.deletedAt) throw new Error("ACCOUNT_DELETED");
      if (!user) {
        [user] = await tx.insert(users).values({ phone, phoneVerifiedAt: new Date() }).returning();
      }
      await this.ledger.grantWelcomeInTransaction(tx, user.id);
      const sessionToken = randomBytes(32).toString("base64url");
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1_000);
      await tx.insert(sessions).values({ userId: user.id, tokenHash: digest(this.secret, sessionToken), expiresAt });
      return { user, sessionToken, expiresAt };
    });
  }
}
