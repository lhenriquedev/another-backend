import z from "zod";
import { categories, classes, users } from "../../database/schema";
import { checkRequestJWT } from "../../hooks/check-request-jwt";
import { checkUserRole } from "../../hooks/check-user-role";
import { db } from "../../database/client";
import { eq } from "drizzle-orm";
import { fromZonedTime } from "date-fns-tz";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

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
        ,
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
          message: "Usuário especificado não é um instrutor",
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


      const startDateTimeString = `${date}T${startTime}:00`;
      const endDateTimeString = `${date}T${endTime}:00`;

      const startTimeUTC = fromZonedTime(startDateTimeString, timezone);
      const endTimeUTC = fromZonedTime(endDateTimeString, timezone);

      if (startTimeUTC >= endTimeUTC) {
        return reply.status(400).send({
          message: "Horário de início deve ser anterior ao horário de término",
        });
      }


      const now = new Date();

      if (startTimeUTC < now) {
        return reply.status(400).send({
          message: "Não é possível criar aulas com horário de início no passado",
        });
      }

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
          date,
          startTime: startTimeUTC,
          endTime: endTimeUTC,
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
