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

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(registerRoute);
app.register(loginRoute);
app.register(profileRoute);
app.register(verifyAccountRoute);
app.register(resendCodeRoute);

export { app };
