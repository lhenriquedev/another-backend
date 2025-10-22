import { and, desc, eq, sql } from "drizzle-orm";
import z from "zod";
import { db } from "../../database/client.ts";
import { categories, checkins, classes } from "../../database/schema.ts";
import { checkRequestJWT } from "../../hooks/check-request-jwt.ts";
import { checkUserRole } from "../../hooks/check-user-role.ts";
import { getAuthenticatedUserFromRequest } from "../../utils/get-authenticated-user-from-request.ts";

import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

export const getRecentClassRoute: FastifyPluginAsyncZod = async (server) => {
  server.get(
    "/get-recent-classes",
    {
      preHandler: [
        checkRequestJWT,
        checkUserRole(["admin", "instructor", "student"]),
      ],
      schema: {
        querystring: z.object({
          cursor: z.uuid().optional(),
          limit: z.coerce.number().min(1).max(100).default(20),
        }),
        response: {
          200: z.object({
            classes: z.array(
              z.object({
                id: z.string(),
                date: z.string(),
                startTime: z.date(),
                categoryType: z
                  .enum([
                    "Misto",
                    "Kids I",
                    "Kids II",
                    "Iniciante",
                    "Competição",
                    "Intermediário",
                    "Avançado",
                  ])
                  .nullable(),
              })
            ),
            // pagination: z.object({
            //   hasMore: z.boolean(),
            //   nextCursor: z.uuid().nullable(),
            //   total: z.number(),
            // }),
          }),
          400: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const user = getAuthenticatedUserFromRequest(request);
      const { cursor, limit } = request.query;

      const classesData = await db
        .select({
          id: classes.id,
          date: classes.date,
          startTime: classes.startTime,
          categoryType: categories.type,
        })
        .from(checkins)
        .innerJoin(classes, eq(classes.id, checkins.classId))
        .innerJoin(categories, eq(categories.id, classes.categoryId))
        .where(
          and(
            eq(checkins.userId, user.sub),
            eq(checkins.status, "done"),
            sql`${checkins.completedAt} >= NOW() - INTERVAL '30 days'`
          )
        )
        .orderBy(desc(checkins.completedAt));

      return reply.send({
        classes: classesData,
      });
    }
  );
};
