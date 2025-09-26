import z from "zod";
import { classes } from "../../database/schema.ts";
import { db } from "../../database/client.ts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // 2025-01-31
const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/; // 19:00 ou 19:00:00

type NewClass = typeof classes.$inferInsert;

export const createClassRoute: FastifyPluginAsyncZod = async (server) => {
  server.post(
    "/create-class",
    {
      schema: {
        body: z
          .object({
            title: z.string().optional(),
            description: z.string().optional(),
            date: z.string().regex(dateRegex),
            startTime: z.string().regex(timeRegex),
            endTime: z.string().regex(timeRegex),
            instructorId: z.uuid(),
            isRecurring: z.boolean().optional().default(false),
            recurrenceRule: z.string().optional(),
            recurrenceEndDate: z.date().optional(),
            capacity: z.coerce.number().default(10),
            status: z.enum([
              "finished",
              "in-progress",
              "cancelled",
              "not-started",
            ]),
          })
          .refine((v) => v.startTime < v.endTime, {
            message: "startTime deve ser menor que endTime",
            path: ["startTime"],
          })
          .refine(
            (v) => !v.isRecurring || (v.recurrenceRule && v.recurrenceEndDate),
            {
              message:
                "recurrenceRule e recurrenceEndDate são obrigatórios quando isRecurring=true",
              path: ["recurrenceRule"],
            }
          ),
        response: {
          200: z.object({ id: z.string(), message: z.string() }),
          400: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const data = request.body as NewClass;

      const [newClass] = await db.insert(classes).values(data).returning();

      return reply
        .status(200)
        .send({ id: newClass.id, message: "Aula criada com sucesso" });
    }
  );
};
