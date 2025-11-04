import { endOfMonth, startOfMonth } from "date-fns";
import { and, count, eq, gte, lte } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { db } from "../../database/client.ts";
import { checkins, users } from "../../database/schema.ts";
import { checkRequestJWT } from "../../hooks/check-request-jwt.ts";
import { getAuthenticatedUserFromRequest } from "../../utils/get-authenticated-user-from-request.ts";

export const summaryRoute: FastifyPluginAsyncZod = async (server) => {
  server.get(
    "/summary",
    {
      preHandler: [checkRequestJWT],
      schema: {
        response: {
          200: z.object({
            summary: z.object({
              totalCheckins: z.coerce.number(),
              checkinsThisMonth: z.coerce.number(),
            }),
          }),
          401: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const user = getAuthenticatedUserFromRequest(request);
      const userId = user.sub;

      const today = new Date();
      const startMonth = startOfMonth(today);
      const endMonth = endOfMonth(today);

      const [[summary], [checkinThisMonth]] = await Promise.all([
        db
          .select({
            totalCheckins: count(checkins.id),
          })
          .from(users)
          .innerJoin(checkins, eq(checkins.userId, userId))
          .where(eq(users.id, userId)),

        db
          .select({ total: count(checkins.id) })
          .from(checkins)
          .where(
            and(
              eq(checkins.userId, userId),
              gte(checkins.createdAt, startMonth),
              lte(checkins.createdAt, endMonth)
            )
          ),
      ]);

      return {
        summary: {
          totalCheckins: summary.totalCheckins,
          checkinsThisMonth: checkinThisMonth.total,
        },
      };
    }
  );
};
