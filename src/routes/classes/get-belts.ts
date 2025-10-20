import z from 'zod';
import { db } from '../../database/client';

import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

export const getBeltsRoute: FastifyPluginAsyncZod = async (server) => {
  server.get(
    "/belts",
    {
      schema: {
        response: {
          200: z.object({
            belts: z.array(
              z.object({
                id: z.string(),
                belt: z.enum(["white", "blue", "purple", "brown", "black"]),
              })
            )
          }),
          400: z.object({ message: z.string() })
        },
      },
    },
    async (request, reply) => {

      const belts = await db.query.belts.findMany({
        columns: { id: true, belt: true }
      })

      if (!belts) {
        return reply.status(400).send({ message: 'Nenhuma faixa cadastrada' })
      }

      return reply.status(200).send({ belts })
    }
  );
};
