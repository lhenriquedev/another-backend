import {
  uuid,
  pgTable,
  text,
  pgEnum,
  boolean,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["admin", "student", "instructor"]);
export const beltRole = pgEnum("belts_role", [
  "white",
  "blue",
  "purple",
  "brown",
  "black",
]);

export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  email: text().notNull().unique(),
  password: text().notNull(),
  role: userRole().notNull().default("student"),
  isActive: boolean().notNull().default(false),
  beltId: uuid()
    .notNull()
    .references(() => belts.id),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const belts = pgTable("belts", {
  id: uuid().primaryKey().defaultRandom(),
  belt: beltRole().notNull(),
  createdAt: timestamp().defaultNow(),
  requiredClasses: integer().notNull(),
});

export const emailConfirmations = pgTable("email_confirmations", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  codeHash: text().notNull(),
  expiresAt: timestamp().notNull(),
  isConsumed: boolean().default(false),
  createdAt: timestamp().notNull().defaultNow(),
});
