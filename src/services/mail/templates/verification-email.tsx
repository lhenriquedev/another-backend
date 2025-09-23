import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface VerificationEmailTemplateProps {
  name: string;
  email: string;
  code: string;
}

export function VerificationEmailTemplate({
  name,
  email,
  code,
}: VerificationEmailTemplateProps) {
  const previewText = "Verifique seu endereço de email";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto py-12 px-4 max-w-md">
            <Section className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <Section className="text-center mb-6">
                <div className="text-4xl">🔐</div>
              </Section>

              <Heading className="text-gray-900 text-xl font-semibold text-center mb-6">
                Verifique seu email
              </Heading>

              <Text className="text-gray-600 text-sm leading-relaxed mb-6">
                Olá {name}! Por favor, verifique seu endereço de email{" "}
                <strong>{email}</strong> usando o código de verificação abaixo.
              </Text>

              <Section className="text-center mb-6">
                <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 font-mono text-2xl font-bold text-gray-900 tracking-widest">
                  {code}
                </div>
              </Section>

              <Text className="text-gray-500 text-xs leading-relaxed text-center">
                Digite este código no formulário de verificação para concluir a
                configuração da sua conta.
              </Text>

              <Text className="text-gray-400 text-xs leading-relaxed text-center mt-6 pt-6 border-t border-gray-100">
                Se você não solicitou este código de verificação, pode ignorar
                este email com segurança.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
