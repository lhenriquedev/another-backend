import { eq } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { db } from "../../database/client.ts";
import { users } from "../../database/schema.ts";
import { checkRequestJWT } from "../../hooks/check-request-jwt.ts";
import { checkUserRole } from "../../hooks/check-user-role.ts";
import { getAuthenticatedUserFromRequest } from "../../utils/get-authenticated-user-from-request.ts";

export const uploadAvatarRoute: FastifyPluginAsyncZod = async (server) => {
  server.post(
    "/upload-avatar",
    {
      preHandler: [
        checkRequestJWT,
        checkUserRole(["instructor", "admin", "student"]),
      ],
    },
    async (request, reply) => {
      const user = getAuthenticatedUserFromRequest(request);

      const avatar = await request.file();

      if (!avatar) {
        return reply.status(400).send({ message: "Avatar é obrigatório" });
      }

      try {
        const buffer = await avatar.toBuffer();

        const uploadResponse = await new Promise<UploadApiResponse>(
          (resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: "avatars",
                public_id: `user_${user.sub}`,
                resource_type: "image",
                overwrite: true,
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result!);
              }
            );

            uploadStream.end(buffer);
          }
        );

        await db
          .update(users)
          .set({
            avatar: uploadResponse.secure_url,
            avatarUpdatedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.sub))
          .returning();
      } catch (error) {
        console.error("Cloudinary upload error:", error);
        return reply
          .status(400)
          .send({ message: "Erro ao fazer upload da imagem" });
      }

      return reply.status(200).send({
        message: "Avatar atualizado com sucesso",
      });
    }
  );
};
