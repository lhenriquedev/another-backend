import z from "zod";
import { categories, classes, users } from "../../database/schema.ts";
import { checkRequestJWT } from "../../hooks/check-request-jwt.ts";
import { checkUserRole } from "../../hooks/check-user-role.ts";
import { db } from "../../database/client.ts";
import { eq } from "drizzle-orm";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { isBefore, parseISO, startOfDay } from "date-fns";

export const createClassRoute: FastifyPluginAsyncZod = async (server) => {
  server.post(
    "/create-class",
    {
      preHandler: [checkRequestJWT, checkUserRole(["instructor", "admin"])],
      schema: {
        body: z
          .object({
            title: z.string().optional(),
            description: z.string().optional(),
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            startTime: z.string().regex(/^\d{2}:\d{2}$/), // Formato HH:mm como "19:43"
            endTime: z.string().regex(/^\d{2}:\d{2}$/), // Formato HH:mm como "21:30"
            instructorId: z.uuid(),
            categoryId: z.uuid(),
            capacity: z.coerce.number().default(10),
          })
          .refine((v) => v.startTime < v.endTime, {
            message: "startTime deve ser menor que endTime",
            path: ["startTime"],
          }),
        response: {
          200: z.object({ id: z.string(), message: z.string() }),
          400: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const {
        title,
        description,
        date,
        startTime,
        endTime,
        instructorId,
        categoryId,
        capacity,
      } = request.body;

      const timezone = "America/Sao_Paulo";

      const classDate = parseISO(date);
      const today = startOfDay(toZonedTime(new Date(), timezone));

      if (isBefore(classDate, today)) {
        return reply.status(400).send({
          message: "Não é possível criar aulas em datas passadas",
        });
      }

      const [instructor] = await db
        .select()
        .from(users)
        .where(eq(users.id, instructorId));

      if (!instructor) {
        return reply.status(400).send({
          message: "Instrutor não encontrado",
        });
      }

      if (instructor.role === "student") {
        return reply.status(400).send({
          message: "Usuário especificado não é um instrutor ",
        });
      }

      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, categoryId));

      if (!category) {
        return reply.status(400).send({
          message: "Categoria não encontrada",
        });
      }

      // Aqui vem a parte crucial: construir os timestamps corretamente
      // Separar horas e minutos dos horários fornecidos
      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);

      // Criar objetos Date com a data fornecida e os horários
      // Esses objetos representam momentos no timezone de São Paulo
      const startDateTime = new Date(classDate);
      startDateTime.setHours(startHour, startMinute, 0, 0);

      const endDateTime = new Date(classDate);
      endDateTime.setHours(endHour, endMinute, 0, 0);

      if (startDateTime >= endDateTime) {
        return reply.status(400).send({
          message: "Horário de início deve ser anterior ao horário de término",
        });
      }

      const startTimeUTC = fromZonedTime(startDateTime, timezone);
      const endTimeUTC = fromZonedTime(endDateTime, timezone);

      const now = new Date();
      let initialStatus: "not-started" | "in-progress" | "finished";

      if (now < startTimeUTC) {
        initialStatus = "not-started";
      } else if (now >= startTimeUTC && now < endTimeUTC) {
        initialStatus = "in-progress";
      } else {
        initialStatus = "finished";
      }

      const [newClass] = await db
        .insert(classes)
        .values({
          title,
          description,
          date, // Mantém a data como string no formato yyyy-MM-dd
          startTime: startTimeUTC, // Timestamp em UTC
          endTime: endTimeUTC, // Timestamp em UTC
          instructorId,
          categoryId,
          capacity,
        })
        .returning();

      return reply
        .status(200)
        .send({ id: newClass.id, message: "Aula criada com sucesso" });
    }
  );
};
