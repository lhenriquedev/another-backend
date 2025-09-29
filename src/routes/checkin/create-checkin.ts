import z, { uuid } from "zod";
import { checkins, classes, users } from "../../database/schema.ts";
import { db } from "../../database/client.ts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { checkRequestJWT } from "../../hooks/check-request-jwt.ts";
import { checkUserRole } from "../../hooks/check-user-role.ts";
import { and, count, eq, sql } from "drizzle-orm";
import { getAuthenticatedUserFromRequest } from "../../utils/get-authenticated-user-from-request.ts";
import { parseISO } from "date-fns";

export const createCheckinRoute: FastifyPluginAsyncZod = async (server) => {
  server.post(
    "/create-checkin",
    {
      preHandler: [checkRequestJWT, checkUserRole(["instructor", "admin"])],
      schema: {
        body: z.object({ classId: uuid() }),
        response: {
          200: z.object({ message: z.string() }),
          400: z.object({ message: z.string() }),
          409: z.object({ message: z.string() }),
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

      const now = new Date();
      const startDateTime = parseISO(`${classData}T${classData.startTime}`);

      if (classData.status === "finished") {
        return reply.status(400).send({ message: "Aula já finalizada" });
      }

      if (classData.status === "in-progress" || now >= startDateTime) {
        return reply.status(400).send({ message: "Está aula já começou" });
      }

      const [existingCheckin] = await db
        .select()
        .from(checkins)
        .where(and(eq(checkins.userId, userId), eq(checkins.classId, classId)));

      if (existingCheckin && existingCheckin.status !== "cancelled") {
        return reply.status(409).send({
          message: "Aluno já está possui check-in nesta aula",
        });
      }

      const [{ totalCheckins }] = await db
        .select({
          totalCheckins: sql<number>`CAST(COUNT(CASE WHEN ${checkins.status} IN ('pending','done') THEN 1 END) as int)`,
        })
        .from(checkins)
        .where(eq(checkins.classId, classId));

      if (totalCheckins >= classData.capacity) {
        return reply
          .status(409)
          .send({ message: "Capacidade da aula já foi atingida" });
      }

      await db.insert(checkins).values({ userId, classId });

      return reply.status(200).send({ message: "Você fez check-in na aula" });
    }
  );
};
