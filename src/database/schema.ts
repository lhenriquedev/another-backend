import { sql } from "drizzle-orm";
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
  uniqueIndex,
  check,
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
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const belts = pgTable("belts", {
  id: uuid().primaryKey().defaultRandom(),
  belt: beltRole().notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow(),
  requiredClasses: integer().notNull(),
});

export const categories = pgTable("categories", {
  id: uuid().primaryKey().defaultRandom(),
  type: categoryRole().notNull(),
  description: text(),
  createdAt: timestamp({ withTimezone: true }).defaultNow(),
});

export const classes = pgTable(
  "classes",
  {
    id: uuid().primaryKey().defaultRandom(),
    title: text(),
    description: text(),
    date: date({ mode: "string" }).notNull(),
    startTime: time().notNull(),
    endTime: time().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow(),
    instructorId: uuid().references(() => users.id),
    isRecurring: boolean().default(false),
    recurrenceRule: text(),
    recurrenceEndDate: date({ mode: "string" }),
    capacity: integer(),
    status: statusRole().default("not-started"),
  },
  (table) => [
    check("capacity_check", sql`${table.capacity} >= 0`),
    check("timeOrder_check", sql`${table.startTime} < ${table.endTime}`),
    check(
      "classes_recurrence_consistency_check",
      sql`( ${table.isRecurring} = false AND ${table.recurrenceRule} IS NULL AND ${table.recurrenceEndDate} IS NULL )
       OR ( ${table.isRecurring} = true AND ${table.recurrenceRule} IS NOT NULL AND ${table.recurrenceEndDate} IS NOT NULL )`
    ),
  ]
);

export const checkins = pgTable(
  "checkins",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    classId: uuid()
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true }).defaultNow(),
  },
  (table) => [uniqueIndex().on(table.userId, table.classId)]
);

export const emailConfirmations = pgTable("email_confirmations", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  codeHash: text().notNull(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  isConsumed: boolean().default(false),
  createdAt: timestamp().notNull().defaultNow(),
});
