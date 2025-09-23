import { Resend } from "resend";
import { VerificationEmailTemplate } from "./templates/verification-email.tsx";

const resendClient = new Resend(process.env.RESEND_API_KEY!);

type VerificationEmailProps = {
  name: string;
  code: string;
  email: string;
};

export async function resendVerificationEmail({
  name,
  code,
  email,
}: VerificationEmailProps) {
  // Lógica para reenviar o email de verificação
  const { data, error } = await resendClient.emails.send({
    from: "onboarding@resend.dev",
    to: "lhenrique.dev@gmail.com",
    subject: "Verifique seu email",
    react: VerificationEmailTemplate({ name, code, email }),
  });

  if (error) {
    console.error("Erro ao reenviar email:", error);
    throw new Error("Erro ao reenviar email");
  }

  return data;
}
