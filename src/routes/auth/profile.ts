import z from "zod";
import { and, count, eq, gte, lte } from "drizzle-orm";
import { belts, checkins, users } from "../../database/schema.ts";
import { checkRequestJWT } from "../../hooks/check-request-jwt.ts";
import { db } from "../../database/client.ts";
import { endOfMonth, startOfMonth } from "date-fns";
import { getAuthenticatedUserFromRequest } from "../../utils/get-authenticated-user-from-request.ts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

export const profileRoute: FastifyPluginAsyncZod = async (server) => {
  server.get(
    "/me",
    {
      preHandler: [checkRequestJWT],
      schema: {
        response: {
          200: z.object({
            user: z.object({
              name: z.string(),
              email: z.string(),
              isActive: z.boolean(),
              belt: z.string(),
              classesCompletedInCurrentBelt: z.number(),
              requiredClassesInCurrentBelt: z.number(),
              checkinsThisMonth: z.number(),
            }),
          }),
          401: z.object({ message: "Unauthorized" }),
          404: z.object({ message: "User not found" }),
        },
      },
    },
    async (request, reply) => {
      const user = getAuthenticatedUserFromRequest(request);

      const now = new Date();
      const _startOfMonth = startOfMonth(now);
      const _endOfMonth = endOfMonth(now);

      const [currentUserResult, checkinsThisMonthResult] = await Promise.all([
        db
          .select({
            belt: belts.belt,
            name: users.name,
            email: users.email,
            isActive: users.isActive,
            classesCompletedInCurrentBelt: users.classesCompletedInCurrentBelt,
            requiredClassesInCurrentBelt: belts.requiredClasses,
          })
          .from(users)
          .innerJoin(belts, eq(belts.id, users.beltId))
          .where(eq(users.id, user.sub)),
        db
          .select({ count: count() })
          .from(checkins)
          .where(
            and(
              eq(checkins.userId, user.sub),
              eq(checkins.status, "done"),
              gte(checkins.completedAt, _startOfMonth),
              lte(checkins.completedAt, _endOfMonth)
            )
          ),
      ]);

      const [currentUser] = currentUserResult;
      const [checkinsThisMonth] = checkinsThisMonthResult;

      if (!currentUser)
        return reply.status(404).send({ message: "User not found" });

      return {
        user: {
          ...currentUser,
          checkinsThisMonth: checkinsThisMonth.count,
        },
      };
    }
  );
};
