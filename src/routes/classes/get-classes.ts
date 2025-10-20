import z from "zod";
import { and, eq, sql, desc, asc, inArray, SQL } from "drizzle-orm";
import { checkins, classes, users, categories } from "../../database/schema";
import { checkRequestJWT } from "../../hooks/check-request-jwt";
import { checkUserRole } from "../../hooks/check-user-role";
import { db } from "../../database/client";
import { parseISO, startOfDay, endOfDay } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

export const getClassRoute: FastifyPluginAsyncZod = async (server) => {
  server.get(
    "/classes",
    {
      preHandler: [
        checkRequestJWT,
        checkUserRole(["admin", "instructor", "student"]),
      ],
      schema: {
        querystring: z.object({
          date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
          startDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
          endDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
          categoryId: z.uuid().optional(),
          status: z.enum(["not-started", "in-progress", "finished"]).optional(),
          cursor: z.uuid().optional(),
          limit: z.coerce.number().min(1).max(100).default(20),
          order: z.enum(["asc", "desc"]).default("asc"),
        }),
        response: {
          200: z.object({
            classes: z.array(
              z.object({
                id: z.string(),
                title: z.string().nullable(),
                description: z.string().nullable(),
                date: z.string(),
                startTime: z.string(),
                endTime: z.string(),
                capacity: z.number(),
                status: z.enum(["not-started", "in-progress", "finished"]),
                instructor: z.object({ id: z.string(), name: z.string() }),
                category: z.object({
                  id: z.string().nullable(),
                  type: z.string().nullable(),
                }),
                checkinsSummary: z.object({
                  total: z.number(),
                  available: z.number(),
                }),
              })
            ),
            pagination: z.object({
              hasMore: z.boolean(),
              nextCursor: z.uuid().nullable(),
              total: z.number(),
            }),
          }),
          400: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const {
        date,
        startDate,
        endDate,
        status,
        cursor,
        limit,
        order,
        categoryId,
      } = request.query;

      if (date && (startDate || endDate)) {
        return reply.status(400).send({
          message:
            "Não é possível usar 'date' junto com 'startDate' ou 'endDate'",
        });
      }

      if (startDate && endDate) {
        const start = parseISO(startDate);
        const end = parseISO(endDate);

        if (start > end) {
          return reply.status(400).send({
            message: "A data inicial deve ser anterior ou igual à data final",
          });
        }
      }

      const timeZone = "America/Sao_Paulo";
      const now = new Date();

      const filterConditions: SQL<unknown>[] = [];

      if (date) {
        const targetDate = parseISO(date);
        const startOfDayInSaoPaulo = startOfDay(targetDate);
        const endOfDayInSaoPaulo = endOfDay(targetDate);
        const startOfDayUTC = fromZonedTime(startOfDayInSaoPaulo, timeZone);
        const endOfDayUTC = fromZonedTime(endOfDayInSaoPaulo, timeZone);

        filterConditions.push(
          sql<boolean>`${classes.startTime} >= ${startOfDayUTC} AND ${classes.startTime} <= ${endOfDayUTC}`
        );
      }

      if (startDate) {
        const start = parseISO(startDate);
        const startOfDayInSaoPaulo = startOfDay(start);
        const startOfDayUTC = fromZonedTime(startOfDayInSaoPaulo, timeZone);

        filterConditions.push(
          sql<boolean>`${classes.startTime} >= ${startOfDayUTC}`
        );
      }

      if (endDate) {
        const end = parseISO(endDate);
        const endOfDayInSaoPaulo = endOfDay(end);
        const endOfDayUTC = fromZonedTime(endOfDayInSaoPaulo, timeZone);

        filterConditions.push(
          sql<boolean>`${classes.startTime} <= ${endOfDayUTC}`
        );
      }

      if (status === "not-started") {
        filterConditions.push(sql<boolean>`${classes.startTime} > ${now}`);
      } else if (status === "in-progress") {
        filterConditions.push(
          sql<boolean>`${classes.startTime} <= ${now} AND ${classes.endTime} > ${now}`
        );
      } else if (status === "finished") {
        filterConditions.push(sql<boolean>`${classes.endTime} <= ${now}`);
      }

      if (categoryId) {
        filterConditions.push(
          sql<boolean>`${classes.categoryId} = ${categoryId}`
        );
      }

      const filterWhereClause =
        filterConditions.length > 0 ? and(...filterConditions) : undefined;

      const paginationConditions: SQL<unknown>[] = [...filterConditions];

      if (cursor) {
        const [cursorClass] = await db
          .select({ startTime: classes.startTime })
          .from(classes)
          .where(eq(classes.id, cursor))
          .limit(1);

        if (cursorClass) {
          if (order === "asc") {
            paginationConditions.push(
              sql<boolean>`(${classes.startTime} > ${cursorClass.startTime} OR 
                   (${classes.startTime} = ${cursorClass.startTime} AND ${classes.id} > ${cursor}))`
            );
          } else {
            paginationConditions.push(
              sql<boolean>`(${classes.startTime} < ${cursorClass.startTime} OR 
                   (${classes.startTime} = ${cursorClass.startTime} AND ${classes.id} < ${cursor}))`
            );
          }
        }
      }

      const paginationWhereClause =
        paginationConditions.length > 0
          ? and(...paginationConditions)
          : undefined;

      const [totalResult] = await db
        .select({ count: sql<number>`CAST(COUNT(*) as int)` })
        .from(classes)
        .where(filterWhereClause);

      const total = totalResult?.count || 0;

      const classesData = await db
        .select({
          id: classes.id,
          title: classes.title,
          description: classes.description,
          date: classes.date,
          startTime: classes.startTime,
          endTime: classes.endTime,
          capacity: classes.capacity,
          instructorId: classes.instructorId,
          instructorName: users.name,
          categoryId: classes.categoryId,
          categoryType: categories.type,
          categoryDescription: categories.description,
        })
        .from(classes)
        .leftJoin(categories, eq(categories.id, classes.categoryId))
        .innerJoin(users, eq(users.id, classes.instructorId))
        .where(paginationWhereClause)
        .orderBy(
          order === "asc" ? asc(classes.startTime) : desc(classes.startTime),
          order === "asc" ? asc(classes.id) : desc(classes.id)
        )
        .limit(limit + 1);

      const hasMore = classesData.length > limit;
      const classesToReturn = hasMore
        ? classesData.slice(0, limit)
        : classesData;
      const nextCursor = hasMore
        ? classesToReturn[classesToReturn.length - 1].id
        : null;

      const classIds = classesToReturn.map((c) => c.id);

      let usersInClass: Array<{
        classId: string;
        userId: string;
        userName: string;
        checkinStatus: "done" | "pending" | "cancelled" | null;
      }> = [];

      if (classIds.length > 0) {
        usersInClass = await db
          .select({
            classId: checkins.classId,
            userId: users.id,
            userName: users.name,
            checkinStatus: checkins.status,
          })
          .from(checkins)
          .innerJoin(users, eq(users.id, checkins.userId))
          .where(inArray(checkins.classId, classIds))
          .orderBy(users.name);
      }

      let checkinCounts: Array<{ classId: string; count: number }> = [];

      if (classIds.length > 0) {
        checkinCounts = await db
          .select({
            classId: checkins.classId,
            count: sql<number>`CAST(COUNT(*) as int)`,
          })
          .from(checkins)
          .where(
            and(
              inArray(checkins.classId, classIds),
              sql<boolean>`${checkins.status} != 'cancelled'`
            )
          )
          .groupBy(checkins.classId);
      }

      const checkinCountMap = new Map(
        checkinCounts.map((item) => [item.classId, item.count])
      );

      const result = classesToReturn.map((_class) => {
        const startTime = toZonedTime(new Date(_class.startTime), timeZone);
        const endTime = toZonedTime(new Date(_class.endTime), timeZone);
        const nowInZone = toZonedTime(now, timeZone);

        let classStatus: "not-started" | "in-progress" | "finished";
        if (nowInZone < startTime) {
          classStatus = "not-started";
        } else if (nowInZone >= startTime && nowInZone < endTime) {
          classStatus = "in-progress";
        } else {
          classStatus = "finished";
        }

        const totalCheckins = checkinCountMap.get(_class.id) || 0;

        if (!_class.instructorId || !_class.instructorName) {
          throw new Error(`Aula ${_class.id} está sem instrutor válido`);
        }

        return {
          id: _class.id,
          title: _class.title,
          description: _class.description,
          date: _class.date,
          startTime: _class.startTime.toISOString(), // Converter Date para string
          endTime: _class.endTime.toISOString(), // Converter Date para string
          capacity: _class.capacity,
          status: classStatus,
          instructor: {
            id: _class.instructorId, // Agora existe no select
            name: _class.instructorName,
          },
          category: {
            id: _class.categoryId,
            type: _class.categoryType,
          },
          checkinsSummary: {
            total: totalCheckins,
            available: _class.capacity - totalCheckins,
          },
        };
      });

      return reply.send({
        classes: result,
        pagination: {
          hasMore,
          nextCursor,
          total,
        },
      });
    }
  );
};
