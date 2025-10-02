import z from "zod";
import { checkRequestJWT } from "../../hooks/check-request-jwt.ts";
import { db } from "../../database/client.ts";
import { eq } from "drizzle-orm";
import { getAuthenticatedUserFromRequest } from "../../utils/get-authenticated-user-from-request.ts";
import { users } from "../../database/schema.ts";
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
              role: z.string(),
              isActive: z.boolean(),
              beltId: z.uuid(),
              classesCompletedInCurrentBelt: z.number()
            }),
          }),
          404: z.null().describe("User profile not found"),
        },
      },
    },
    async (request, reply) => {
      const user = getAuthenticatedUserFromRequest(request);

      const [currentUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.sub));

      if (currentUser) {
        return { user: currentUser };
      }

      return reply.status(404).send();
    }
  );
};
