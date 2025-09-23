import {
  uuid,
  pgTable,
  text,
  pgEnum,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["admin", "student"]);

export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  email: text().notNull().unique(),
  password: text().notNull(),
  role: userRole().notNull().default("student"),
  isActive: boolean().notNull().default(false),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const emailConfirmations = pgTable("email_confirmations", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  code: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  expiresAt: timestamp().notNull(),
  confirmedAt: timestamp().defaultNow(),
});
