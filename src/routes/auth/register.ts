import z from "zod";
import { db } from "../../database/client.ts";
import { users } from "../../database/schema.ts";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

export const registerRoute: FastifyPluginAsyncZod = async (server) => {
  server.post(
    "/register",
    {
      schema: {
        body: z.object({
          email: z.email('Email inválido').min(1, 'Email é obrigatório'),
          password: z.string().min(8, 'Email deve conter 8 caracteres'),
          name: z.string(),
          birthDate: z.string(),
          gender: z.enum(['female', 'male']),
          phone: z.string().optional(),
          beltId: z.uuid(),
        }),
        response: {
          201: z.object({ code: z.string() }),
          400: z.object({ message: z.string() }),
          409: z.object({ message: z.string() })
        },
      },
    },
    async (request, reply) => {
      const { email, password, name, beltId, birthDate, gender, phone } = request.body;

      const existingUser = await db.query.users.findFirst(
        { columns: { email: true }, where: eq(users.email, email) }
      )

      if (existingUser) {
        return reply.status(409).send({ message: "Usuário já existe" });
      }

      const passwordHash = await hash(password, 8);

      await db
        .insert(users)
        .values({
          email,
          name,
          password: passwordHash,
          isActive: true,
          birthDate: birthDate,
          gender,
          phone,
          beltId,
        })
        .returning();

      return reply.status(201).send();
    }
  );
};
