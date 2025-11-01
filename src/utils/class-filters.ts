import { endOfDay, parseISO, startOfDay } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { sql, SQL, eq } from "drizzle-orm";
import { classes } from "../database/schema.ts";
import { TIMEZONE } from "../constants/index.ts";

function convertDateToUTC(dateString: string, isEndOfDay = false): Date {
  const parsedDate = parseISO(dateString);
  const dateInTimezone = isEndOfDay
    ? endOfDay(parsedDate)
    : startOfDay(parsedDate);
  return fromZonedTime(dateInTimezone, TIMEZONE);
}

export function buildDateFilters(params: {
  date?: string;
  startDate?: string;
  endDate?: string;
}): SQL<unknown>[] {
  const filters: SQL<unknown>[] = [];

  if (params.date) {
    const startOfDayUTC = convertDateToUTC(params.date, false);
    const endOfDayUTC = convertDateToUTC(params.date, true);

    filters.push(
      sql<boolean>`${classes.startTime} >= ${startOfDayUTC} AND ${classes.startTime} <= ${endOfDayUTC}`
    );
  }

  if (params.startDate) {
    const startOfDayUTC = convertDateToUTC(params.startDate, false);
    filters.push(sql<boolean>`${classes.startTime} >= ${startOfDayUTC}`);
  }

  if (params.endDate) {
    const endOfDayUTC = convertDateToUTC(params.endDate, true);
    filters.push(sql<boolean>`${classes.startTime} <= ${endOfDayUTC}`);
  }

  return filters;
}

export function buildStatusFilters(
  status: "not-started" | "in-progress" | "finished" | undefined,
  now: Date
): SQL<unknown>[] {
  const filters: SQL<unknown>[] = [];

  if (status === "not-started") {
    filters.push(sql<boolean>`${classes.startTime} > ${now}`);
  } else if (status === "in-progress") {
    filters.push(
      sql<boolean>`${classes.startTime} <= ${now} AND ${classes.endTime} > ${now}`
    );
  } else if (status === "finished") {
    filters.push(sql<boolean>`${classes.endTime} <= ${now}`);
  }

  return filters;
}

export function buildCategoryFilter(
  categoryId: string | undefined
): SQL<unknown>[] {
  if (!categoryId) return [];
  return [sql<boolean>`${classes.categoryId} = ${categoryId}`];
}

export async function buildCursorCondition(
  cursor: string,
  order: "asc" | "desc",
  db: any
): Promise<SQL<unknown> | null> {
  const [cursorClass] = await db
    .select({ startTime: classes.startTime })
    .from(classes)
    .where(eq(classes.id, cursor))
    .limit(1);

  if (!cursorClass) return null;

  if (order === "asc") {
    return sql<boolean>`(${classes.startTime} > ${cursorClass.startTime} OR
         (${classes.startTime} = ${cursorClass.startTime} AND ${classes.id} > ${cursor}))`;
  } else {
    return sql<boolean>`(${classes.startTime} < ${cursorClass.startTime} OR
         (${classes.startTime} = ${cursorClass.startTime} AND ${classes.id} < ${cursor}))`;
  }
}
