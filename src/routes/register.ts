import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { db } from "../database/client.ts";
import { users } from "../database/schema.ts";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

export const registerRoute: FastifyPluginAsyncZod = async (server) => {
  server.post(
    "/register",
    {
      schema: {
        body: z.object({
          email: z.email(),
          password: z.string(),
          name: z.string(),
          role: z.enum(["admin", "student"]).default("student"),
        }),
      },
    },
    async (request, reply) => {
      const { email, password, role, name } = request.body;

      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (result.length > 0) {
        return reply.status(400).send({ message: "Usuário já existe" });
      }

      const passwordHash = await hash(password, 6);

      await db
        .insert(users)
        .values({ email, name, password: passwordHash, role })
        .returning();

      return reply.status(201).send({ message: "Usuário criado com sucesso" });
    }
  );
};
