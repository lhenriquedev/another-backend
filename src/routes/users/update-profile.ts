import { eq } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { db } from "../../database/client.ts";
import { users } from "../../database/schema.ts";
import { checkRequestJWT } from "../../hooks/check-request-jwt.ts";
import { checkUserRole } from "../../hooks/check-user-role.ts";
import { getAuthenticatedUserFromRequest } from "../../utils/get-authenticated-user-from-request.ts";

export const updateProfileRoute: FastifyPluginAsyncZod = async (server) => {
  server.patch(
    "/update-profile",
    {
      preHandler: [
        checkRequestJWT,
        checkUserRole(["instructor", "admin", "student"]),
      ],
      schema: {
        body: z.object({
          name: z.string().optional(),
          gender: z.enum(["male", "female"]).optional(),
          phone: z.string().optional(),
          birthDate: z.string().optional(),
          email: z.email().optional(),
        }),
        response: {
          200: z.object({ message: z.string() }),
          400: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const user = getAuthenticatedUserFromRequest(request);

      const { birthDate, email, gender, name, phone } = request.body;

      const [updatedUser] = await db
        .update(users)
        .set({
          birthDate,
          email,
          gender,
          name,
          phone,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.sub))
        .returning();

      if (!updatedUser) {
        return reply.status(404).send({ message: "Usuário não" });
      }

      return reply.status(200).send({
        message: "Perfil atualizado com sucesso",
      });
    }
  );
};
