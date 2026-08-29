import nodemailer from "nodemailer";

export interface VerificationEmailSender {
  sendVerificationCode(input: {
    email: string;
    code: string;
    expiresAt: Date;
  }): Promise<void>;
}

class ConsoleVerificationEmailSender implements VerificationEmailSender {
  async sendVerificationCode(input: {
    email: string;
    code: string;
    expiresAt: Date;
  }) {
    console.info(
      `[auth] verification code for ${input.email}: ${input.code} (expires ${input.expiresAt.toISOString()})`,
    );
  }
}

class SmtpVerificationEmailSender implements VerificationEmailSender {
  private readonly transport;

  constructor(
    smtpUrl: string,
    private readonly from: string,
  ) {
    this.transport = nodemailer.createTransport(smtpUrl);
  }

  async sendVerificationCode(input: {
    email: string;
    code: string;
    expiresAt: Date;
  }) {
    await this.transport.sendMail({
      from: this.from,
      to: input.email,
      subject: "一页纸简历登录验证码",
      text: `你的验证码是 ${input.code}，10 分钟内有效。若非本人操作，请忽略此邮件。`,
    });
  }
}

export function createVerificationEmailSender(): VerificationEmailSender {
  const smtpUrl = process.env.SMTP_URL;
  if (smtpUrl) {
    return new SmtpVerificationEmailSender(
      smtpUrl,
      process.env.EMAIL_FROM ?? "resume@example.com",
    );
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("SMTP_NOT_CONFIGURED");
  }
  return new ConsoleVerificationEmailSender();
}
