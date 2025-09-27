import z from "zod";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { checkRequestJWT } from "../../hooks/check-request-jwt.ts";
import { checkUserRole } from "../../hooks/check-user-role.ts";
import { db } from "../../database/client.ts";
import { checkins, classes, users } from "../../database/schema.ts";
import { and, count, eq, sql, SQL } from "drizzle-orm";

export const getClassRoute: FastifyPluginAsyncZod = async (server) => {
  server.get(
    "/get-classes",
    {
      preHandler: [
        checkRequestJWT,
        checkUserRole(["admin", "instructor", "student"]),
      ],
      schema: {
        querystring: z.object({
          currentDate: z.string().optional(),
        }),
        response: {
          200: z.object({
            classes: z.any(),
            total: z.number(),
          }),
          400: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { currentDate } = request.query;

      const conditions: SQL[] = [];

      if (currentDate) {
        conditions.push(eq(classes.date, currentDate));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;
      const [classesData, usersInClass, total] = await Promise.all([
        db
          .select({
            id: classes.id,
            title: classes.title,
            description: classes.description,
            date: classes.date,
            startTime: classes.startTime,
            endTime: classes.endTime,
            instructorId: classes.instructorId,
            capacity: classes.capacity,
            // status: classes.status,
            status: sql`CASE
                WHEN NOW() < ${classes.startTime} THEN 'not-started'
                WHEN NOW() >= ${classes.startTime} AND NOW() < ${classes.endTime} THEN 'in-progress'
                ELSE 'finished'
                END
              `.as("status"),
            categoryId: classes.categoryId,
            totalCheckins: count(checkins.id),
          })
          .from(classes)
          .leftJoin(checkins, eq(checkins.classId, classes.id))
          .where(whereClause)
          .groupBy(classes.id),
        db
          .select({ classId: checkins.classId, name: users.name, id: users.id })
          .from(checkins)
          .innerJoin(users, eq(users.id, checkins.userId)),
        db.$count(classes, whereClause),
      ]);

      const result = classesData.map((_class) => ({
        ..._class,
        usersInClass: usersInClass
          .filter((user) => user.classId === _class.id)
          .map((user) => ({ id: user.id, name: user.name })),
      }));

      return reply.send({ classes: result, total });
    }
  );
};
