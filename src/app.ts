import fastify from "fastify";
import { loginRoute } from "./routes/login.ts";
import { profileRoute } from "./routes/profile.ts";
import { registerRoute } from "./routes/register.ts";
import { resendCodeRoute } from "./routes/resend-code.ts";
import { verifyAccountRoute } from "./routes/verify-account.ts";

import {
  validatorCompiler,
  serializerCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { ZodError } from "zod";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(registerRoute);
app.register(loginRoute);
app.register(profileRoute);
app.register(verifyAccountRoute);
app.register(resendCodeRoute);

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
