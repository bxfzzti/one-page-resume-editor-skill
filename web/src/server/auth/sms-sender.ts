export interface VerificationSmsSender {
  sendVerificationCode(input: { phone: string; code: string; expiresAt: Date }): Promise<void>;
}

class ConsoleVerificationSmsSender implements VerificationSmsSender {
  async sendVerificationCode(input: { phone: string; code: string; expiresAt: Date }) {
    const maskedPhone = `${input.phone.slice(0, 3)}****${input.phone.slice(-4)}`;
    console.info(`[auth] verification code for ${maskedPhone}: ${input.code} (expires ${input.expiresAt.toISOString()})`);
  }
}

export function createVerificationSmsSender(): VerificationSmsSender {
  if (process.env.NODE_ENV === "production") throw new Error("SMS_PROVIDER_NOT_CONFIGURED");
  return new ConsoleVerificationSmsSender();
}
