import z from "zod";
import { db } from "../database/client.ts";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { emailConfirmations, users } from "../database/schema.ts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { generateNumericCode } from "../lib/verification.ts";
import { resendVerificationEmail } from "../services/mail/resend.ts";

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

      const [user] = await db
        .insert(users)
        .values({ email, name, password: passwordHash, role, isActive: false })
        .returning();

      const code = generateNumericCode();

      await db.insert(emailConfirmations).values({
        userId: user.id,
        code,
        expiresAt: new Date(Date.now() + 1000 * 60 * 10), // 10 minutos,
      });

      await resendVerificationEmail({ code, email, name });

      return reply.status(201).send({ message: "Usuário criado com sucesso" });
    }
  );
};
