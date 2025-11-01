import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.ts";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: String(process.env.DATABASE_URL),
});

export const db = drizzle(pool, { schema });
