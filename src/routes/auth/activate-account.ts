import z from "zod";
import { and, eq, gt } from "drizzle-orm";
import { compare } from "bcryptjs";
import { db } from "../../database/client";
import { emailConfirmations, users } from "../../database/schema";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

export const activateAccountRoute: FastifyPluginAsyncZod = async (server) => {
  server.post(
    "/activate-account",
    {
      schema: {
        body: z.object({
          email: z.email(),
          code: z.string().length(6),
        }),
      },
    },
    async (request, reply) => {
      const { code, email } = request.body;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user)
        return reply.status(400).send({ message: "Usuário não encontrado" });

      const now = new Date();

      const [verification] = await db
        .select()
        .from(emailConfirmations)
        .where(
          and(
            eq(emailConfirmations.userId, user.id),
            eq(emailConfirmations.isConsumed, false),
            gt(emailConfirmations.expiresAt, now)
          )
        );

      if (!verification)
        return reply
          .status(400)
          .send({ message: "Código inválido ou expirado" });

      const codeHash = await compare(code, verification.codeHash);

      if (!codeHash) {
        return reply.status(400).send({ message: "Código inválido" });
      }

      await db.transaction(async (tx) => {
        await tx
          .update(emailConfirmations)
          .set({ isConsumed: true })
          .where(eq(emailConfirmations.id, verification.id));

        await tx
          .update(users)
          .set({ isActive: true, updatedAt: now })
          .where(eq(users.id, user.id));
      });

      return reply.status(200).send({ message: "Conta ativada com sucesso" });
    }
  );
};
