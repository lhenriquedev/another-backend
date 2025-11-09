import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { db } from "../../database/client.ts";
import { users } from "../../database/schema.ts";

export const registerRoute: FastifyPluginAsyncZod = async (server) => {
  server.post(
    "/register",
    {
      schema: {
        body: z.object({
          email: z.email("Email inválido").min(1, "Email é obrigatório"),
          password: z.string().min(8, "Email deve conter 8 caracteres"),
          name: z.string().min(1, "Nome é obrigatório"),
          gender: z.enum(["female", "male"]),
          beltId: z.uuid(),
        }),
        response: {
          201: z.object({ message: z.string() }),
          400: z.object({ message: z.string() }),
          409: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { email, password, name, beltId, gender } = request.body;

      const existingUser = await db.query.users.findFirst({
        columns: { email: true },
        where: eq(users.email, email),
      });

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
          gender,
          beltId,
        })
        .returning();

      return reply
        .status(201)
        .send({ message: "Sua conta foi criada com sucesso!" });
    }
  );
};
