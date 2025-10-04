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
  uniqueIndex,
  check,
  index,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["admin", "student", "instructor"]);
export const beltEnum = pgEnum("belts_role", [
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

// export const statusRole = pgEnum("status_role", [
//   "finished",
//   "in-progress",
//   "cancelled",
//   "not-started",
// ]);

export const checkinStatus = pgEnum("checkin_status", ["done", "cancelled"]);

export const users = pgTable(
  "users",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    email: text().notNull().unique(),
    password: text().notNull(),
    role: userRole().notNull().default("student"),
    isActive: boolean().notNull().default(false),

    beltId: uuid()
      .notNull()
      .references(() => belts.id),
    classesCompletedInCurrentBelt: integer().notNull().default(0),

    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
  },
  (table) => ({
    beltIdIdx: index("users_belt_id_idx").on(table.beltId),
  })
);

export const belts = pgTable("belts", {
  id: uuid().primaryKey().defaultRandom(),
  belt: beltEnum().notNull(),
  createdAt: timestamp().defaultNow(),
  requiredClasses: integer().notNull(),
});

export const categories = pgTable("categories", {
  id: uuid().primaryKey().defaultRandom(),
  type: categoryRole().notNull(),
  description: text(),
  createdAt: timestamp().defaultNow(),
});

export const classes = pgTable(
  "classes",
  {
    id: uuid().primaryKey().defaultRandom(),
    title: text(),
    description: text(),
    date: date({ mode: "string" }).notNull(),
    startTime: timestamp({ withTimezone: true }).notNull(),
    endTime: timestamp({ withTimezone: true }).notNull(),
    capacity: integer().notNull().default(0),
    // status: statusRole().default("not-started"),

    instructorId: uuid().references(() => users.id),
    categoryId: uuid().references(() => categories.id),

    createdAt: timestamp().defaultNow(),
  },
  (table) => [
    check("capacity_check", sql`${table.capacity} >= 0`),
    check("timeOrder_check", sql`${table.startTime} < ${table.endTime}`),
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
    completedAt: timestamp().defaultNow(),
    status: checkinStatus().default("done"),

    createdAt: timestamp().defaultNow(),
  },
  (table) => [
    uniqueIndex().on(table.userId, table.classId),
    index("checkins_user_status_date_idx").on(
      table.userId,
      table.status,
      table.completedAt
    ),
  ]
);

export const emailConfirmations = pgTable("email_confirmations", {
  id: uuid().primaryKey().defaultRandom(),

  codeHash: text().notNull(),
  expiresAt: timestamp().notNull(),
  isConsumed: boolean().default(false),

  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),

  createdAt: timestamp().notNull().defaultNow(),
});
