// Applies db/schema.sql to the Neon database in DATABASE_URL.
// Usage: npm run db:migrate
import { readFileSync } from "node:fs";
import { neon, neonConfig } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Add it to .env.local first.");
  process.exit(1);
}
// Match src/lib/db.ts: when the app talks to a local Neon-compatible HTTP proxy,
// migrate that database rather than the remote one behind DATABASE_URL.
if (process.env.NEON_FETCH_ENDPOINT) neonConfig.fetchEndpoint = () => process.env.NEON_FETCH_ENDPOINT;
const sql = neon(url);
const statements = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8")
  .split(/;\s*$/m)
  .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
  .filter(Boolean);

for (const statement of statements) {
  await sql.query(statement);
}
const target = process.env.NEON_FETCH_ENDPOINT ? `proxy ${process.env.NEON_FETCH_ENDPOINT}` : "Neon (DATABASE_URL)";
console.log(`Applied ${statements.length} statements to ${target}. Database is ready.`);
