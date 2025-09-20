import fastify from "fastify";
import { loginRoute } from "./routes/login.ts";
import { registerRoute } from "./routes/register.ts";

import {
  validatorCompiler,
  serializerCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { profileRoute } from "./routes/profile.ts";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(registerRoute);
app.register(loginRoute);
app.register(profileRoute);

export { app };
