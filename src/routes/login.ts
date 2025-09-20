import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { db } from "../database/client.ts";
import { users } from "../database/schema.ts";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";

export const loginRoute: FastifyPluginAsyncZod = async (server) => {
  server.post(
    "/login",
    {
      schema: {
        body: z.object({
          email: z.email(),
          password: z.string(),
        }),
        response: {
          200: z.object({ token: z.string() }),
          400: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      console.log(result);

      if (result.length === 0) {
        return reply.status(400).send({ message: "Credenciais inválidas" });
      }

      const user = result[0];

      const doesPasswordsMatch = await compare(password, user.password);

      if (!doesPasswordsMatch) {
        return reply.status(400).send({ message: "Credenciais inválidas" });
      }

      return reply.status(200).send({ token: "ok" });
    }
  );
};
