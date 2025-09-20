import { getAuthenticatedUserFromRequest } from "../utils/get-authenticated-user-from-request.ts";
import type { FastifyRequest, FastifyReply } from "fastify";

export function checkUserRole(role: "student" | "manager") {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const user = getAuthenticatedUserFromRequest(request);

    if (user.role !== role) {
      return reply.status(401).send();
    }
  };
}
