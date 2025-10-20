import { getAuthenticatedUserFromRequest } from "../utils/get-authenticated-user-from-request";
import type { FastifyRequest, FastifyReply } from "fastify";

type Roles = "admin" | "student" | "instructor";

export function checkUserRole(role: Roles[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const user = getAuthenticatedUserFromRequest(request);

    if (!role.includes(user.role)) {
      return reply.status(401).send();
    }
  };
}
