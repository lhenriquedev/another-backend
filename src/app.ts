import fastify from "fastify";
import { cancelCheckinRoute } from "./routes/checkin/cancel-checkin";
import { createCheckinRoute } from "./routes/checkin/create-checkin";
import { createClassRoute } from "./routes/classes/create-class";
import { getClassRoute } from "./routes/classes/get-classes";
import { loginRoute } from "./routes/auth/login";
import { profileRoute } from "./routes/auth/profile";
import { registerRoute } from "./routes/auth/register";

import { ZodError } from "zod";
import cors from "@fastify/cors"

import {
  validatorCompiler,
  serializerCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { getClassByIdRoute } from "./routes/classes/get-class-by-id";
import { getBeltsRoute } from "./routes/classes/get-belts";
import { getRecentClassRoute } from "./routes/classes/get-recent-class";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.register(cors, {
  methods: '*'
})

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(registerRoute);
app.register(loginRoute);
app.register(profileRoute);

app.register(createClassRoute);
app.register(getClassRoute);
app.register(getClassByIdRoute);
app.register(getRecentClassRoute)

app.register(createCheckinRoute);
app.register(cancelCheckinRoute);

app.register(getBeltsRoute)

app.setErrorHandler((error, _, reply) => {
  if (error instanceof ZodError) {
    return reply
      .status(400)
      .send({ message: "Validation error", issues: error.flatten().fieldErrors });
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(error);
  } else {
    // here we should log to a external tool like datadog, new relic or sentry
  }

  return reply.status(500).send({ message: "Internal server error" });
});

export { app };
