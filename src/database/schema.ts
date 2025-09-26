import {
  uuid,
  pgTable,
  text,
  pgEnum,
  boolean,
  timestamp,
  integer,
  date,
  time,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["admin", "student", "instructor"]);
export const beltRole = pgEnum("belts_role", [
  "white",
  "blue",
  "purple",
  "brown",
  "black",
]);
export const categoryRole = pgEnum("category_role", [
  "Misto",
  "Kids I",
  "Kids II",
  "Iniciante",
  "Competição",
  "Intermediário",
  "Avançado",
]);

export const statusRole = pgEnum("status_role", [
  "finished",
  "in-progress",
  "cancelled",
  "not-started",
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

export const categories = pgTable("categories", {
  id: uuid().primaryKey().defaultRandom(),
  type: categoryRole().notNull(),
  description: text(),
  createdAt: timestamp().defaultNow(),
});

export const classes = pgTable("classes", {
  id: uuid().primaryKey().defaultRandom(),
  title: text(),
  description: text(),
  date: date({ mode: "date" }).notNull(),
  startTime: time().notNull(),
  endTime: time().notNull(),
  createdAt: timestamp().defaultNow(),
  instructorId: uuid().references(() => users.id),
  isRecurring: boolean().default(false),
  recurrenceRule: text(),
  recurrenceEndDate: date(),
  capacity: integer(),
  status: statusRole().default("not-started"),
});

export const checkins = pgTable("checkins", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().references(() => users.id),
  classId: uuid().references(() => classes.id),
  createdAt: timestamp().defaultNow(),
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
