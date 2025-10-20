import z from "zod";
import { eq, } from "drizzle-orm"; // Adicionar inArray aqui
import {
  checkins,
  classes,
  users,
  categories,
  belts,
} from "../../database/schema";
import { checkRequestJWT } from "../../hooks/check-request-jwt";
import { checkUserRole } from "../../hooks/check-user-role";
import { db } from "../../database/client";

import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { getClassStatus } from "../../utils/get-class-status";

export const getClassByIdRoute: FastifyPluginAsyncZod = async (server) => {
  server.get(
    "/classes/:classId",
    {
      preHandler: [
        checkRequestJWT,
        checkUserRole(["admin", "instructor", "student"]),
      ],
      schema: {
        params: z.object({ classId: z.uuid() }),
        response: {},
      },
    },
    async (request, reply) => {
      const { classId } = request.params;

      const [classData] = await db
        .select({
          id: classes.id,
          title: classes.title,
          description: classes.description,
          date: classes.date,
          startTime: classes.startTime,
          endTime: classes.endTime,
          capacity: classes.capacity,
          instructorId: users.id,
          instructorName: users.name,
          instructorBeltId: belts.id,
          instructorBelt: belts.belt,
          categoryId: categories.id,
          categoryType: categories.type,
        })
        .from(classes)
        .innerJoin(users, eq(users.id, classes.instructorId))
        .innerJoin(belts, eq(belts.id, users.beltId))
        .leftJoin(categories, eq(categories.id, classes.categoryId))
        .where(eq(classes.id, classId));

      if (!classData) {
        return reply.status(404).send({ message: "Aula não encontrada" });
      }

      if (!classData.instructorId) {
        throw new Error(`Aula ${classId} está sem instrutor válido`);
      }

      const studentsWithCheckins = await db
        .select({
          userId: users.id,
          userName: users.name,
          userEmail: users.email,
          userBeltId: belts.id,
          userBelt: belts.belt,
          checkinId: checkins.id,
          checkinStatus: checkins.status,
          checkinCreatedAt: checkins.createdAt,
          checkinCompletedAt: checkins.completedAt,
        })
        .from(checkins)
        .innerJoin(users, eq(users.id, checkins.userId))
        .innerJoin(belts, eq(belts.id, users.beltId))
        .where(eq(checkins.classId, classId))
        .orderBy(users.name);

      const students = studentsWithCheckins.map((student) => ({
        id: student.userId,
        name: student.userName,
        email: student.userEmail,
        belt: student.userBelt,
        checkin: {
          id: student.checkinId,
          status: student.checkinStatus,
          createdAt: student.checkinCreatedAt?.toISOString(),
          completedAt: student.checkinCompletedAt?.toISOString() || null,
        },
      }));

      const totalCheckins = students.filter(
        (s) => s.checkin.status !== "cancelled"
      ).length;

      const completedCheckins = students.filter(
        (s) => s.checkin.status === "done"
      ).length;
      const cancelledCheckins = students.filter(
        (s) => s.checkin.status === "cancelled"
      ).length;
      const availableSpots = classData.capacity - totalCheckins;

      const occupancyRate =
        classData.capacity > 0
          ? Math.round((totalCheckins / classData.capacity) * 100)
          : 0;

      return reply.send({
        id: classData.id,
        title: classData.title,
        description: classData.description,
        date: classData.date,
        startTime: classData.startTime.toISOString(),
        endTime: classData.endTime.toISOString(),
        capacity: classData.capacity,
        status: getClassStatus({
          startTime: classData.startTime,
          endTime: classData.endTime,
        }),
        instructor: {
          id: classData.instructorId,
          name: classData.instructorName,
          belt: classData.instructorBelt,
        },
        category: {
          id: classData.categoryId,
          type: classData.categoryType,
        },
        students,
        statistics: {
          totalCheckins,
          completedCheckins,
          cancelledCheckins,
          availableSpots,
          occupancyRate,
        },
      });
    }
  );
};
