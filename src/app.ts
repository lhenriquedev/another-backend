import fastify from "fastify";
import { loginRoute } from "./routes/auth/login.ts";
import { profileRoute } from "./routes/auth/profile.ts";
import { registerRoute } from "./routes/auth/register.ts";
import { resendCodeRoute } from "./routes/auth/resend-code.ts";
import { verifyAccountRoute } from "./routes/auth/verify-account.ts";

import {
  validatorCompiler,
  serializerCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { ZodError } from "zod";
import { createClassRoute } from "./routes/classes/create-class.ts";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(registerRoute);
app.register(loginRoute);
app.register(profileRoute);
app.register(verifyAccountRoute);
app.register(resendCodeRoute);
app.register(createClassRoute);

app.setErrorHandler((error, _, reply) => {
  if (error instanceof ZodError) {
    return reply
      .status(400)
      .send({ message: "Validation error", issues: error.format() });
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(error);
  } else {
    // here we should log to a external tool like datadog, new relic or sentry
  }

  return reply.status(500).send({ message: "Internal server error" });
});

export { app };
