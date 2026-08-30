export const GUEST_DAILY_RUN_LIMIT = 3;
export const GUEST_DATA_TTL_MS = 24 * 60 * 60 * 1_000;

export function isAnonymousPreviewEnabled() {
  return (process.env.AUTH_MODE ?? "anonymous_preview") === "anonymous_preview";
}
