import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  getTestDatabaseUrl,
  loadTestEnvironment,
} from "../src/test/database-config";

loadTestEnvironment();

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = join(__dirname, "../drizzle");

function getDatabaseName(databaseUrl: string): string {
  return decodeURIComponent(new URL(databaseUrl).pathname.replace(/^\//, ""));
}

function getAdminDatabaseUrl(databaseUrl: string): string {
  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = "/postgres";
  return adminUrl.toString();
}

async function createDatabaseIfMissing(databaseUrl: string): Promise<void> {
  const databaseName = getDatabaseName(databaseUrl);
  const adminSql = postgres(getAdminDatabaseUrl(databaseUrl), { max: 1 });

  try {
    const rows = await adminSql<{ exists: boolean }[]>`
      select exists(select 1 from pg_database where datname = ${databaseName}) as "exists"
    `;

    if (!rows[0]?.exists) {
      await adminSql.unsafe(`create database "${databaseName}"`);
    }
  } finally {
    await adminSql.end();
  }
}

async function truncateBusinessTables(databaseUrl: string): Promise<void> {
  const sql = postgres(databaseUrl, { max: 1 });

  try {
    const tables = await sql<{ tablename: string }[]>`
      select tablename
      from pg_tables
      where schemaname = 'public'
        and tablename <> '__drizzle_migrations'
      order by tablename
    `;

    if (tables.length === 0) {
      return;
    }

    const tableList = tables
      .map(({ tablename }) => {
        if (!/^[A-Za-z0-9_]+$/.test(tablename)) {
          throw new Error(`UNSAFE_TABLE_NAME: ${tablename}`);
        }

        return `"public"."${tablename}"`;
      })
      .join(", ");

    await sql.unsafe(`truncate table ${tableList} restart identity cascade`);
  } finally {
    await sql.end();
  }
}

async function prepareTestDatabase(): Promise<void> {
  const databaseUrl = getTestDatabaseUrl();

  await createDatabaseIfMissing(databaseUrl);

  const migrationSql = postgres(databaseUrl, { max: 1 });
  try {
    const db = drizzle(migrationSql);
    await migrate(db, { migrationsFolder });
  } finally {
    await migrationSql.end();
  }

  await truncateBusinessTables(databaseUrl);
}

prepareTestDatabase().catch((error) => {
  console.error(error);
  process.exit(1);
});
