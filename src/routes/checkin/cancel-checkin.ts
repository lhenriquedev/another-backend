import z, { uuid } from "zod";
import { checkins, classes, users } from "../../database/schema.ts";
import { db } from "../../database/client.ts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { checkRequestJWT } from "../../hooks/check-request-jwt.ts";
import { checkUserRole } from "../../hooks/check-user-role.ts";
import { and, eq } from "drizzle-orm";
import { getAuthenticatedUserFromRequest } from "../../utils/get-authenticated-user-from-request.ts";

export const cancelCheckinRoute: FastifyPluginAsyncZod = async (server) => {
  server.patch(
    "/cancel-checkin",
    {
      preHandler: [checkRequestJWT, checkUserRole(["instructor", "admin"])],
      schema: {
        body: z.object({ classId: uuid() }),
        response: {
          200: z.object({ message: z.string() }),
          400: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const user = getAuthenticatedUserFromRequest(request);
      const userId = user.sub;

      const { classId } = request.body;

      const [classData] = await db
        .select()
        .from(classes)
        .where(eq(classes.id, classId));

      if (!classData) {
        return reply.status(400).send({ message: "Aula não existe" });
      }

      const [existingCheckin] = await db
        .select()
        .from(checkins)
        .where(and(eq(checkins.userId, userId), eq(checkins.classId, classId)));

      if (!existingCheckin) {
        return reply.status(400).send({ message: "Check-in não encontrado" });
      }

      if (existingCheckin.status === "cancelled") {
        return reply.status(400).send({ message: "Check-in já cancelado" });
      }

      await db
        .update(checkins)
        .set({ status: "cancelled" })
        .where(and(eq(checkins.userId, userId), eq(checkins.classId, classId)));

      return reply
        .status(200)
        .send({ message: "Check-in cancelado com sucesso" });
    }
  );
};
