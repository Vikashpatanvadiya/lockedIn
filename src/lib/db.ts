import "server-only";
import { neon, neonConfig } from "@neondatabase/serverless";
// Optional: point the driver at a local Neon-compatible HTTP proxy during development.
if (process.env.NEON_FETCH_ENDPOINT) neonConfig.fetchEndpoint = () => process.env.NEON_FETCH_ENDPOINT!;

const url = process.env.DATABASE_URL;

export const sql = neon(url ?? "postgresql://missing:missing@localhost/missing");

export function assertDb() {
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string.");
  }
}
