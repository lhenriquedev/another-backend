import z, { uuid } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { checkins, classes, users } from "../../database/schema.ts";
import { checkRequestJWT } from "../../hooks/check-request-jwt.ts";
import { checkUserRole } from "../../hooks/check-user-role.ts";
import { db } from "../../database/client.ts";
import { getAuthenticatedUserFromRequest } from "../../utils/get-authenticated-user-from-request.ts";
import { getClassStatus } from "../../utils/get-class-status.ts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

export const cancelCheckinRoute: FastifyPluginAsyncZod = async (server) => {
  server.patch(
    "/cancel-checkin",
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

      const [existingCheckin] = await db
        .select()
        .from(checkins)
        .where(and(
          eq(checkins.userId, userId),
          eq(checkins.classId, classId)
        ));

      if (!existingCheckin) {
        return reply.status(400).send({ message: "Check-in não encontrado" });
      }

      if (existingCheckin.status === "cancelled") {
        return reply.status(400).send({ message: "Check-in já cancelado" });
      }

      const status = getClassStatus({
        startTime: classData.startTime,
        endTime: classData.endTime,
      });

      const isInstructorOfClass =
        currentUserRole === "instructor" &&
        currentUserId === classData.instructorId;

      const isAdmin = currentUserRole === "admin";
      const hasSpecialPermission = isInstructorOfClass || isAdmin;


      if (!hasSpecialPermission) {
        return reply
          .status(403)
          .send({ message: "Você não tem permissão para fazer esta ação." });
      }

      if (userId !== currentUserId) {
        return reply.status(403).send({
          message: "Você só pode fazer check-in para si mesmo",
        });
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
        .where(eq(users.id, userId));

      if (!targetUser) {
        return reply.status(400).send({ message: "Usuário não encontrado" });
      }

      await db
        .update(checkins)
        .set({
          status: "cancelled",
          completedAt: null,
        })
        .where(and(
          eq(checkins.userId, userId),
          eq(checkins.classId, classId)
        ));

      const message = userId === currentUserId
        ? "Check-in cancelado com sucesso"
        : "Check-in do aluno cancelado com sucesso";

      return reply.status(200).send({ message });
    }
  );
};