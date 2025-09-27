import z from "zod";
import { categories, classes, users } from "../../database/schema.ts";
import { db } from "../../database/client.ts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { checkRequestJWT } from "../../hooks/check-request-jwt.ts";
import { checkUserRole } from "../../hooks/check-user-role.ts";
import { eq } from "drizzle-orm";

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
            date: z
              .string()
              .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido, use YYYY-MM-DD"),
            startTime: z.coerce.date(), // valida ISO 8601
            endTime: z.coerce.date(),
            instructorId: z.uuid(),
            categoryId: z.uuid(),
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
          }),
        response: {
          200: z.object({ id: z.string(), message: z.string() }),
          400: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const data = request.body;

      const [instructor, category] = await Promise.all([
        db
          .select()
          .from(users)
          .where(eq(users.id, data.instructorId ?? "")),
        db
          .select()
          .from(categories)
          .where(eq(categories.id, data.categoryId ?? "")),
      ]);

      if (!category.length) {
        return reply.status(400).send({ message: "Categoria não cadastrada" });
      }

      if (!instructor.length) {
        return reply.status(400).send({ message: "Instrutor não cadastrado" });
      }

      const [newClass] = await db
        .insert(classes)
        .values({
          ...data,
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
        })
        .returning();

      return reply
        .status(200)
        .send({ id: newClass.id, message: "Aula criada com sucesso" });
    }
  );
};
