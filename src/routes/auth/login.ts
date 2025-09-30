import jwt from "jsonwebtoken";
import z from "zod";
import { compare } from "bcryptjs";
import { db } from "../../database/client.ts";
import { eq } from "drizzle-orm";
import { users } from "../../database/schema.ts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

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

      if (result.length === 0) {
        return reply.status(400).send({ message: "Credenciais inválidas" });
      }

      const user = result[0];

      const doesPasswordsMatch = await compare(password, user.password);

      if (!doesPasswordsMatch) {
        return reply.status(400).send({ message: "Credenciais inválidas" });
      }

      if (!user.isActive) {
        return reply
          .status(400)
          .send({ message: "Essa conta não está ativada" });
      }

      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET must be set.");
      }

      const token = jwt.sign(
        { sub: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return reply.status(200).send({ token });
    }
  );
};
