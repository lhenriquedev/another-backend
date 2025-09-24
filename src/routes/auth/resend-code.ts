import z from "zod";
import { addMinutes } from "date-fns";
import { and, eq, gt } from "drizzle-orm";
import { compare, hash } from "bcryptjs";
import { db } from "../../database/client";
import { emailConfirmations, users } from "../../database/schema";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { generateNumericCode } from "../../lib/verification";
import { resendVerificationEmail } from "../../services/mail/resend";

export const resendCodeRoute: FastifyPluginAsyncZod = async (server) => {
  server.post(
    "/resend-code",
    {
      schema: {
        body: z.object({
          email: z.email(),
        }),
      },
    },
    async (request, reply) => {
      const { email } = request.body;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user)
        return reply.status(400).send({ message: "Usuário não encontrado" });

      const now = new Date();

      const [existingValidCode] = await db
        .select()
        .from(emailConfirmations)
        .where(
          and(
            eq(emailConfirmations.userId, user.id),
            eq(emailConfirmations.isConsumed, false),
            gt(emailConfirmations.expiresAt, now)
          )
        );

      if (existingValidCode)
        return reply.status(200).send({ message: "Código enviado" });

      const newCode = generateNumericCode();
      const codeHash = await hash(newCode, 6);

      await db.insert(emailConfirmations).values({
        codeHash,
        userId: user.id,
        isConsumed: false,
        expiresAt: addMinutes(now, 10),
      });

      await resendVerificationEmail({ code: newCode, email, name: "teste" });

      return reply.status(200).send({ message: "Código enviado" });
    }
  );
};
