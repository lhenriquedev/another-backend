import z, { uuid } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { checkins, classes } from "../../database/schema.ts";
import { checkRequestJWT } from "../../hooks/check-request-jwt.ts";
import { checkUserRole } from "../../hooks/check-user-role.ts";
import { db } from "../../database/client.ts";
import { getAuthenticatedUserFromRequest } from "../../utils/get-authenticated-user-from-request.ts";
import { getClassStatus } from "../../utils/get-class-status.ts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

export const createCheckinRoute: FastifyPluginAsyncZod = async (server) => {
  server.post(
    "/create-checkin",
    {
      preHandler: [
        checkRequestJWT,
        checkUserRole(["instructor", "admin", "student"]),
      ],
      schema: {
        body: z.object({ classId: uuid(), userId: uuid().optional() }),
        response: {
          200: z.object({ message: z.string() }),
          400: z.object({ message: z.string() }),
          403: z.object({ message: z.string() }),
          409: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const user = getAuthenticatedUserFromRequest(request);
      const currentUserId = user.sub;
      const currentUserRole = user.role;

      const { classId, userId: targetUserId } = request.body;

      const userId = targetUserId || currentUserId;

      const [classData] = await db
        .select()
        .from(classes)
        .where(eq(classes.id, classId));

      if (!classData) {
        return reply.status(400).send({ message: "Aula não existe" });
      }

      const status = getClassStatus({
        startTime: classData.startTime,
        endTime: classData.endTime,
      });

      // Bloquear check-in se não estiver em "not-started"
      if (status !== "not-started") {
        return reply
          .status(400)
          .send({ message: "Não é possível fazer check-in nessa aula" });
      }

      const isInstructorOfClass =
        currentUserRole === "instructor" &&
        currentUserId === classData.instructorId;

      const isAdmin = currentUserRole === "admin";

      const hasSpecialPermission = isInstructorOfClass || isAdmin;

      if (!hasSpecialPermission) {
        if (userId !== currentUserId) {
          return reply
            .status(403)
            .send({ message: "Você só pode fazer check-in para sí mesmo" });
        }

        if (status !== "not-started") {
          return reply.status(400).send({
            message: "Não é possível fazer check-in após o início da aula",
          });
        }
      }

      const [existingCheckin] = await db
        .select()
        .from(checkins)
        .where(and(eq(checkins.userId, userId), eq(checkins.classId, classId)));

      if (existingCheckin) {
        if (existingCheckin.status === "cancelled") {
          await db
            .update(checkins)
            .set({ status: "pending", done: false, completedAt: null })
            .where(eq(checkins.id, existingCheckin.id));

          return reply.status(409).send({
            message: "Check-in reativado com sucesso",
          });
        }

        return reply.status(409).send({
          message: "Já existe um check-in ativo para este aluno nesta aula",
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

      const message =
        userId === currentUserId
          ? "Você fez check-in na aula"
          : "Check-in realizado com sucesso para o aluno";

      return reply.status(200).send({ message });
    }
  );
};
