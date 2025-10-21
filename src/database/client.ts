import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from './schema.ts';
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const db = drizzle(pool, { schema });