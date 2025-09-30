import z, { uuid } from "zod";
import { checkins, classes, users } from "../../database/schema.ts";
import { checkRequestJWT } from "../../hooks/check-request-jwt.ts";
import { checkUserRole } from "../../hooks/check-user-role.ts";
import { db } from "../../database/client.ts";
import { eq } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

export const confirmCheckinRoute: FastifyPluginAsyncZod = async (server) => {
  server.post(
    "/confirm-checkin",
    {
      preHandler: [
        checkRequestJWT,
        checkUserRole(["instructor", "admin", "student"]),
      ],
      schema: {
        body: z.object({ checkInId: uuid() }),
        response: {
          200: z.object({ message: z.string() }),
          400: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { checkInId } = request.body;

      const [checkin] = await db
        .select()
        .from(checkins)
        .where(eq(checkins.id, checkInId));

      if (!checkin) {
        return reply
          .status(400)
          .send({ message: "Checkin não encontrado na aula" });
      }

      if (checkin.status !== "pending") {
        return reply
          .status(400)
          .send({ message: "Check-in já confirmado ou cancelado" });
      }

      const [classData] = await db
        .select()
        .from(classes)
        .where(eq(classes.id, checkin.classId));

      if (!classData) {
        return reply.status(400).send({ message: "Aula não encontrada" });
      }

      const now = new Date();
      const startTime = new Date(classData.startTime);

      const hasStarted = now >= startTime;

      // impedir confirmar após a aula ter começado
      if (hasStarted) {
        return reply.status(400).send({
          message: "Não é possível confirmar check-in após o início da aula",
        });
      }

      await db
        .update(checkins)
        .set({ status: "done", completedAt: new Date() })
        .where(eq(checkins.id, checkInId));

      return reply.send({ message: "Check-in confirmado com sucesso" });
    }
  );
};
