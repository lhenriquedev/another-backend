import { and, asc, eq, gt } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { db } from "../../database/client.ts";
import { categories, checkins, classes, users } from "../../database/schema.ts";
import { checkRequestJWT } from "../../hooks/check-request-jwt.ts";
import { checkUserRole } from "../../hooks/check-user-role.ts";
import { getAuthenticatedUserFromRequest } from "../../utils/get-authenticated-user-from-request.ts";

export const upcomingClassesRoute: FastifyPluginAsyncZod = async (server) => {
  server.get(
    "/upcoming-classes",
    {
      preHandler: [checkRequestJWT],
      schema: {
        response: {
          200: z.object({
            upcomingClasses: z.array(
              z.object({
                id: z.string(),
                title: z.string().nullable(),
                description: z.string().nullable(),
                date: z.string(),
                startTime: z.string(),
                endTime: z.string(),
                capacity: z.number(),
                instructor: z.string(),
                category: z.enum(["Misto", "Kids I", "Kids II", "Iniciante", "Competição", "Intermediário", "Avançado"]),
                // status: z.enum(["not-started", "in-progress", "finished"]),
                // instructor: z.object({ id: z.string(), name: z.string() }),
              })
            ),
            total: z.number(),
          }),
          400: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const user = getAuthenticatedUserFromRequest(request);
      const userId = user.sub;

      const upcomingClasses = await db
        .select({
          id: classes.id,
          title: classes.title,
          description: classes.description,
          date: classes.date,
          startTime: classes.startTime,
          endTime: classes.endTime,
          capacity: classes.capacity,
          instructor: users.name,
          category: categories.type
        })
        .from(classes)
        .innerJoin(checkins, eq(checkins.classId, classes.id))
        .innerJoin(users, eq(users.id, classes.instructorId))
        .innerJoin(categories, eq(categories.id, classes.categoryId))
        .where(
          and(eq(checkins.userId, userId), gt(classes.startTime, new Date()))
        )
        .orderBy(asc(classes.startTime))
        .limit(7);

      return reply.status(200).send({
        upcomingClasses: upcomingClasses.map((c) => ({
          title: c.title,
          id: c.id,
          capacity: c.capacity,
          date: c.date,
          description: c.description,
          endTime: c.endTime.toISOString(),
          startTime: c.startTime.toISOString(),
          instructor: c.instructor,
          category: c.category,
        })),
        total: upcomingClasses.length,
      });
    }
  );
};
