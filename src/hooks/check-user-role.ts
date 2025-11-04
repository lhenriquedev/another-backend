import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUserFromRequest } from "../utils/get-authenticated-user-from-request.ts";

type Roles = "admin" | "student" | "instructor";

export function checkUserRole(role: Roles[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const user = getAuthenticatedUserFromRequest(request);

    if (!role.includes(user.role)) {
      return reply.status(401).send();
    }
  };
}
