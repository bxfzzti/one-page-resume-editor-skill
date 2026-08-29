import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgres://resume:resume@127.0.0.1:54329/resume_skill";

const globalForDb = globalThis as unknown as {
  resumeSql?: ReturnType<typeof postgres>;
};

export const sql = globalForDb.resumeSql ?? postgres(databaseUrl, { max: 10 });

if (process.env.NODE_ENV !== "production") {
  globalForDb.resumeSql = sql;
}

export const db = drizzle(sql, { schema });
