import jwt from "jsonwebtoken";
import type { FastifyReply, FastifyRequest } from "fastify";

type JWTPayload = {
  sub: string;
  role: "student" | "admin";
};

export async function checkRequestJWT(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const token = request.headers.authorization;

  if (!token) {
    return reply.status(401).send();
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be set.");
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
    request.user = payload;
  } catch {
    return reply.status(401).send();
  }
}
