import z, { uuid } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { checkins, classes, users } from "../../database/schema.ts";
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
        body: z.object({
          classId: uuid(),
          userId: uuid().optional(),
        }),
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

      const isInstructorOfClass =
        currentUserRole === "instructor" &&
        currentUserId === classData.instructorId;

      const targetId = targetUserId ?? currentUserId;
      const isSelf = targetId === currentUserId;

      const allowed =
        currentUserRole === "admin" ||
        (currentUserRole === "instructor" && isInstructorOfClass) ||
        (currentUserRole === "student" && isSelf);

      if (!allowed) {
        return reply
          .status(403)
          .send({ message: "Você não tem permissão para fazer esta ação." });
      }

      if (currentUserRole === "student" && !isSelf) {
        return reply
          .status(403)
          .send({ message: "Você só pode fazer check-in para si mesmo" });
      }

      if (status !== "not-started") {
        return reply.status(400).send({
          message:
            "Não é possível fazer check-in após o início da aula ou a finalização",
        });
      }

      const [targetUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, targetId));

      if (!targetUser) {
        return reply.status(400).send({ message: "Usuário não encontrado" });
      }

      if (!targetUser.isActive) {
        return reply.status(400).send({
          message: "Não é possível fazer check-in de usuário inativo",
        });
      }

      const [existingCheckin] = await db
        .select()
        .from(checkins)
        .where(and(eq(checkins.userId, targetId), eq(checkins.classId, classId)));

      if (existingCheckin && existingCheckin.status !== "cancelled") {
        return reply.status(409).send({ message: "Já existe um check-in ativo para este aluno nesta aula" })
      }

      if (existingCheckin && existingCheckin.status === "cancelled") {
        await db
          .update(checkins)
          .set({
            status: "done",
            completedAt: new Date(),
          })
          .where(eq(checkins.id, existingCheckin.id));

        return reply.status(200).send({
          message: "Check-in reativado com sucesso",
        });
      }

      const [{ totalCheckins }] = await db
        .select({
          totalCheckins: sql<number>`CAST(COUNT(CASE WHEN ${checkins.status} = 'done' THEN 1 END) as int)`,
        })
        .from(checkins)
        .where(eq(checkins.classId, classId));

      if (totalCheckins >= classData.capacity) {
        return reply.status(409).send({
          message: "Capacidade da aula já foi atingida",
        });
      }

      await db.insert(checkins).values({
        userId: targetId,
        classId,
        status: "done",
        completedAt: new Date(),
      });

      const message =
        targetId === currentUserId
          ? "Você fez check-in na aula"
          : "Check-in realizado com sucesso para o aluno";

      return reply.status(200).send({ message });
    }
  );
};
