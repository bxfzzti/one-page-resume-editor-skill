import { createHash, randomBytes, randomInt } from "node:crypto";
import { and, desc, eq, gt, gte, isNull, sql as drizzleSql } from "drizzle-orm";
import { z } from "zod";
import { db, type ResumeDb } from "@/db/client";
import { emailOtps, sessions, users } from "@/db/schema";
import { PointLedgerService } from "@/server/points/point-ledger";
import {
  createVerificationEmailSender,
  type VerificationEmailSender,
} from "./email-sender";

const emailSchema = z.string().trim().toLowerCase().email();

function digest(secret: string, ...values: string[]): string {
  return createHash("sha256")
    .update([secret, ...values].join(":"))
    .digest("hex");
}

export class AuthService {
  constructor(
    private readonly database: ResumeDb = db,
    private readonly ledger = new PointLedgerService(database),
    private readonly secret = process.env.SESSION_SECRET ??
      "local-development-session-secret-32-bytes",
    private readonly emailSender: VerificationEmailSender =
      createVerificationEmailSender(),
  ) {
    if (this.secret.length < 32) throw new Error("SESSION_SECRET_TOO_SHORT");
  }

  async requestEmailCode(
    inputEmail: string,
    options: { skipCooldown?: boolean } = {},
  ): Promise<{ code: string; expiresAt: Date }> {
    const email = emailSchema.parse(inputEmail);
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1_000);
    const recent = await this.database
      .select({ createdAt: emailOtps.createdAt })
      .from(emailOtps)
      .where(
        and(
          eq(emailOtps.email, email),
          gte(emailOtps.createdAt, fifteenMinutesAgo),
        ),
      )
      .orderBy(desc(emailOtps.createdAt));

    if (recent.length >= 5) throw new Error("OTP_RATE_LIMITED");
    if (
      !options.skipCooldown &&
      recent[0] &&
      now.getTime() - recent[0].createdAt.getTime() < 60_000
    ) {
      throw new Error("OTP_COOLDOWN_ACTIVE");
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1_000);
    const [otp] = await this.database
      .insert(emailOtps)
      .values({
        email,
        codeHash: digest(this.secret, email, code),
        expiresAt,
      })
      .returning({ id: emailOtps.id });

    try {
      await this.emailSender.sendVerificationCode({ email, code, expiresAt });
    } catch {
      await this.database.delete(emailOtps).where(eq(emailOtps.id, otp.id));
      throw new Error("OTP_DELIVERY_FAILED");
    }

    return { code, expiresAt };
  }

  async verifyEmailCode(inputEmail: string, code: string) {
    const email = emailSchema.parse(inputEmail);
    if (!/^\d{6}$/.test(code)) throw new Error("INVALID_OR_EXPIRED_CODE");
    const codeHash = digest(this.secret, email, code);

    return this.database.transaction(async (tx) => {
      await tx.execute(
        drizzleSql`select pg_advisory_xact_lock(hashtext(${email}))`,
      );
      const [otp] = await tx
        .select()
        .from(emailOtps)
        .where(
          and(
            eq(emailOtps.email, email),
            eq(emailOtps.codeHash, codeHash),
            isNull(emailOtps.consumedAt),
            gt(emailOtps.expiresAt, new Date()),
          ),
        )
        .orderBy(desc(emailOtps.createdAt))
        .limit(1);
      if (!otp) throw new Error("INVALID_OR_EXPIRED_CODE");

      await tx
        .update(emailOtps)
        .set({ consumedAt: new Date() })
        .where(and(eq(emailOtps.id, otp.id), isNull(emailOtps.consumedAt)));

      let [user] = await tx.select().from(users).where(eq(users.email, email));
      if (user?.deletedAt) throw new Error("ACCOUNT_DELETED");
      if (!user) {
        [user] = await tx
          .insert(users)
          .values({ email, emailVerifiedAt: new Date() })
          .returning();
      } else if (!user.emailVerifiedAt) {
        [user] = await tx
          .update(users)
          .set({ emailVerifiedAt: new Date() })
          .where(eq(users.id, user.id))
          .returning();
      }

      await this.ledger.grantWelcomeInTransaction(tx, user.id);

      const sessionToken = randomBytes(32).toString("base64url");
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1_000);
      await tx.insert(sessions).values({
        userId: user.id,
        tokenHash: digest(this.secret, sessionToken),
        expiresAt,
      });

      return { user, sessionToken, expiresAt };
    });
  }
}

export function hashSessionToken(token: string): string {
  const secret =
    process.env.SESSION_SECRET ?? "local-development-session-secret-32-bytes";
  return digest(secret, token);
}
