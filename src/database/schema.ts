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
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "student", "instructor"]);
export const beltEnum = pgEnum("belts_role", [
  "white",
  "blue",
  "purple",
  "brown",
  "black",
]);
export const categoryEnum = pgEnum("category_role", [
  "Misto",
  "Kids I",
  "Kids II",
  "Iniciante",
  "Competição",
  "Intermediário",
  "Avançado",
]);

export const checkinStatus = pgEnum("checkin_status", ["done", "cancelled"]);

export const users = pgTable(
  "users",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull().unique(),
    password: varchar({ length: 255 }).notNull(),
    role: userRoleEnum().notNull().default("student"),
    birthDate: date('birth_date', { mode: 'string' }).notNull(),
    gender: varchar({ length: 6 }).notNull(),
    phone: varchar({ length: 20 }),

    isActive: boolean('is_active').notNull().default(false),
    beltId: uuid()
      .notNull()
      .references(() => belts.id),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
);

export const belts = pgTable("belts", {
  id: uuid().primaryKey().defaultRandom(),
  belt: beltEnum().notNull(),
  createdAt: timestamp().defaultNow(),
  requiredClasses: integer().notNull(),
});

export const categories = pgTable("categories", {
  id: uuid().primaryKey().defaultRandom(),
  type: categoryEnum().notNull(),
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

    instructorId: uuid('instructor_id').references(() => users.id),
    categoryId: uuid('category_id').references(() => categories.id),

    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    check("capacity_check", sql`${table.capacity} >= 0`),
    check("timeOrder_check", sql`${table.startTime} < ${table.endTime}`),
    index("classes_start_time_id_idx").on(table.startTime, table.id),
    index("classes_category_id_idx").on(table.categoryId),
    index("classes_instructor_id_idx").on(table.instructorId),
    index("classes_date_idx").on(table.date),
    index("classes_end_time_idx").on(table.endTime),
  ]
);

export const checkins = pgTable(
  "checkins",
  {
    id: uuid().primaryKey().defaultRandom(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    classId: uuid('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    completedAt: timestamp('completed_at').defaultNow(),
    status: checkinStatus().default("done"),

    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    uniqueIndex().on(table.userId, table.classId),
    index("checkins_user_status_idx").on(table.userId, table.status),
    index("checkins_class_idx").on(table.classId),
    index("checkins_completed_at_idx").on(table.completedAt),
  ]
);