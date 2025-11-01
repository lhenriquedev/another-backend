import { and, asc, desc, eq, inArray, sql, SQL } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { CHECKIN_STATUS } from "../../constants/index.ts";
import { db } from "../../database/client.ts";
import { categories, checkins, classes, users } from "../../database/schema.ts";
import { checkRequestJWT } from "../../hooks/check-request-jwt.ts";
import { checkUserRole } from "../../hooks/check-user-role.ts";
import {
  buildDateFilters,
  buildStatusFilters,
  buildCategoryFilter,
  buildCursorCondition,
} from "../../utils/class-filters.ts";
import { getClassStatus } from "../../utils/get-class-status.ts";

export const getClassRoute: FastifyPluginAsyncZod = async (server) => {
  server.get(
    "/classes",
    {
      preHandler: [
        checkRequestJWT,
        checkUserRole(["admin", "instructor", "student"]),
      ],
      schema: {
        querystring: z
          .object({
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
            status: z
              .enum(["not-started", "in-progress", "finished"])
              .optional(),
            cursor: z.uuid().optional(),
            limit: z.coerce.number().min(1).max(100).default(20),
            order: z.enum(["asc", "desc"]).default("asc"),
          })
          .refine(
            (data) => {
              if (data.date && (data.startDate || data.endDate)) {
                return false;
              }
              return true;
            },
            {
              message:
                "Não é possível usar 'date' junto com 'startDate' ou 'endDate'",
            }
          )
          .refine(
            (data) => {
              if (data.startDate && data.endDate) {
                const start = new Date(data.startDate);
                const end = new Date(data.endDate);
                return start <= end;
              }
              return true;
            },
            {
              message: "A data inicial deve ser anterior ou igual à data final",
            }
          ),
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

      const now = new Date();

      const filterConditions: SQL<unknown>[] = [
        ...buildDateFilters({ date, startDate, endDate }),
        ...buildStatusFilters(status, now),
        ...buildCategoryFilter(categoryId),
      ];

      const filterWhereClause =
        filterConditions.length > 0 ? and(...filterConditions) : undefined;

      const paginationConditions: SQL<unknown>[] = [...filterConditions];

      if (cursor) {
        const cursorCondition = await buildCursorCondition(cursor, order, db);
        if (cursorCondition) {
          paginationConditions.push(cursorCondition);
        }
      }

      const paginationWhereClause =
        paginationConditions.length > 0
          ? and(...paginationConditions)
          : undefined;

      const [[totalResult], classesData] = await Promise.all([
        db
          .select({ count: sql<number>`CAST(COUNT(*) as int)` })
          .from(classes)
          .where(filterWhereClause),

        db
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
          .limit(limit + 1),
      ]);

      const total = totalResult?.count || 0;

      const hasMore = classesData.length > limit;
      const classesToReturn = hasMore
        ? classesData.slice(0, limit)
        : classesData;
      const nextCursor = hasMore
        ? classesToReturn[classesToReturn.length - 1].id
        : null;

      const classIds = classesToReturn.map((c) => c.id);

      const checkinCounts =
        classIds.length > 0
          ? await db
              .select({
                classId: checkins.classId,
                count: sql<number>`CAST(COUNT(*) as int)`,
              })
              .from(checkins)
              .where(
                and(
                  inArray(checkins.classId, classIds),
                  sql<boolean>`${checkins.status} != ${CHECKIN_STATUS.CANCELLED}`
                )
              )
              .groupBy(checkins.classId)
          : [];

      const checkinCountMap = new Map(
        checkinCounts.map((item) => [item.classId, item.count])
      );

      const result = classesToReturn.map((classItem) => {
        const classStatus = getClassStatus({
          startTime: classItem.startTime,
          endTime: classItem.endTime,
        });

        const totalCheckins = checkinCountMap.get(classItem.id) || 0;

        if (!classItem.instructorId || !classItem.instructorName) {
          throw new Error(`Aula ${classItem.id} está sem instrutor válido`);
        }

        return {
          id: classItem.id,
          title: classItem.title,
          description: classItem.description,
          date: classItem.date,
          startTime: classItem.startTime.toISOString(),
          endTime: classItem.endTime.toISOString(),
          capacity: classItem.capacity,
          status: classStatus,
          instructor: {
            id: classItem.instructorId,
            name: classItem.instructorName,
          },
          category: {
            id: classItem.categoryId,
            type: classItem.categoryType,
          },
          checkinsSummary: {
            total: totalCheckins,
            available: classItem.capacity - totalCheckins,
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
