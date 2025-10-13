import z from "zod";
import { and, count, eq, gte, lte, sql } from "drizzle-orm";
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
              phone: z.string().nullable(),
              birthDate: z.string(),
              gender: z.string(),
              totalCheckins: z.coerce.number(),
            }),
          }),
          401: z.object({ message: "Unauthorized" }),
          404: z.object({ message: "User not found" }),
        },
      },
    },
    async (request, reply) => {
      const user = getAuthenticatedUserFromRequest(request);

      const [userProfile] = await db
        .select({
          name: users.name,
          email: users.email,
          isActive: users.isActive,
          belt: belts.belt,
          phone: users.phone,
          birthDate: users.birthDate,
          gender: users.gender,
          totalCheckins: sql<number>`count(${checkins.id})`.as('totalCheckins'),
        })
        .from(users)
        .innerJoin(belts, eq(belts.id, users.beltId))
        .leftJoin(checkins, eq(users.id, checkins.userId))
        .where(eq(users.id, user.sub))
        .groupBy(users.id, belts.id)

      if (!userProfile)
        return reply.status(404).send({ message: "User not found" });

      return {
        user: {
          ...userProfile,
        },
      };
    }
  );
};
