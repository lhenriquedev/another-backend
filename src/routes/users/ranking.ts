import { count, desc, eq } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { db } from "../../database/client.ts";
import { checkins, users } from "../../database/schema.ts";
import { checkRequestJWT } from "../../hooks/check-request-jwt.ts";

export const rankingRoute: FastifyPluginAsyncZod = async (server) => {
  server.get(
    "/ranking",
    {
      preHandler: [checkRequestJWT],
      schema: {
        response: {
          200: z.object({
            ranking: z.array(
              z.object({
                userId: z.string(),
                userName: z.string(),
                totalCheckins: z.coerce.number(),
                position: z.int(),
                avatar: z.string().nullable(),
              })
            ),
          }),
          401: z.object({ message: "Unauthorized" }),
          404: z.object({ message: "User not found" }),
        },
      },
    },
    async (request, reply) => {
      const ranking = await db
        .select({
          userId: users.id,
          userName: users.name,
          totalCheckins: count(checkins.id).as("total_checkins"),
          avatar: users.avatar,
        })
        .from(users)
        .leftJoin(checkins, eq(users.id, checkins.userId))
        .groupBy(users.id, users.name)
        .orderBy(desc(count(checkins.id)));

      const rankingData = ranking.map((item, index) => ({
        position: index + 1,
        ...item,
      }));

      return reply.status(200).send({ ranking: rankingData });
    }
  );
};
