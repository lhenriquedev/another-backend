import { and, eq, sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { db } from "../../database/client.ts";
import { belts, checkins, users } from "../../database/schema.ts";
import { checkRequestJWT } from "../../hooks/check-request-jwt.ts";
import { getAuthenticatedUserFromRequest } from "../../utils/get-authenticated-user-from-request.ts";

export const profileRoute: FastifyPluginAsyncZod = async (server) => {
  server.get(
    "/me",
    {
      preHandler: [checkRequestJWT],
      schema: {
        response: {
          200: z.object({
            user: z.object({
              id: z.string(),
              name: z.string(),
              email: z.string(),
              isActive: z.boolean(),
              belt: z.string(),
              phone: z.string().nullable(),
              birthDate: z.string(),
              gender: z.string(),
            }),
          }),
          401: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const user = getAuthenticatedUserFromRequest(request);

      const [userProfile] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          isActive: users.isActive,
          belt: belts.belt,
          phone: users.phone,

          birthDate: users.birthDate,
          gender: users.gender,
        })
        .from(users)
        .innerJoin(belts, eq(belts.id, users.beltId))
        .where(eq(users.id, user.sub))
        .groupBy(users.id, belts.id);

      if (!userProfile)
        return reply.status(404).send({ message: "User not found" });

      return {
        user: userProfile,
      };
    }
  );
};
