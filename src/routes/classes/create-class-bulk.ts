import { eq } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { db } from "../../database/client.ts";
import { categories, classes, users } from "../../database/schema.ts";
import { checkRequestJWT } from "../../hooks/check-request-jwt.ts";
import { checkUserRole } from "../../hooks/check-user-role.ts";
import { generateClassDates } from "../../utils/generate-date.ts";

export const createClassBulkRoute: FastifyPluginAsyncZod = async (server) => {
  server.post(
    "/create-class/bulk",
    {
      preHandler: [checkRequestJWT, checkUserRole(["instructor", "admin"])],
      schema: {
        body: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          startTime: z.string().regex(/^\d{2}:\d{2}$/),
          endTime: z.string().regex(/^\d{2}:\d{2}$/),
          instructorId: z.uuid(),
          categoryId: z.uuid(),
          capacity: z.coerce.number().default(10),
          recurrence: z.object({
            daysOfWeek: z.array(z.number().min(0).max(6)),
            startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          }),
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
        startTime,
        endTime,
        instructorId,
        categoryId,
        capacity,
        recurrence,
      } = request.body;

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

      const dates = generateClassDates(
        recurrence.startDate,
        recurrence.endDate,
        recurrence.daysOfWeek
      );

      if (dates.length === 0) {
        return reply.status(400).send({
          message: "Verifique o período e os dias da semana selecionados.",
        });
      }

      const newClasses = dates.map((date) => {
        return {
          title,
          description,
          date,
          startTime: new Date(`${date}T${startTime}:00`),
          endTime: new Date(`${date}T${endTime}:00`),
          instructorId,
          categoryId,
          capacity: capacity || 20,
        };
      });

      const [newClass] = await db
        .insert(classes)
        .values(newClasses)
        .returning();

      return reply
        .status(200)
        .send({ id: newClass.id, message: "Aula criada com sucesso" });
    }
  );
};
