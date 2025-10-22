import cors from "@fastify/cors";
import fastify from "fastify";
import { ZodError } from "zod";
import { loginRoute } from "./routes/auth/login.ts";
import { registerRoute } from "./routes/auth/register.ts";
import { cancelCheckinRoute } from "./routes/checkin/cancel-checkin.ts";
import { createCheckinRoute } from "./routes/checkin/create-checkin.ts";
import { createClassRoute } from "./routes/classes/create-class.ts";
import { getBeltsRoute } from "./routes/classes/get-belts.ts";
import { getClassByIdRoute } from "./routes/classes/get-class-by-id.ts";
import { getClassRoute } from "./routes/classes/get-classes.ts";
import { getRecentClassRoute } from "./routes/classes/get-recent-class.ts";
import { profileRoute } from "./routes/users/profile.ts";

import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { createClassBulkRoute } from "./routes/classes/create-class-bulk.ts";
import { rankingRoute } from "./routes/users/ranking.ts";
import { updateProfileRoute } from "./routes/users/update-profile.ts";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.register(cors, {
  methods: "*",
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(registerRoute);
app.register(loginRoute);

app.register(profileRoute);
app.register(updateProfileRoute);

app.register(createClassRoute);
app.register(createClassBulkRoute);
app.register(getClassRoute);
app.register(getClassByIdRoute);
app.register(getRecentClassRoute);

app.register(createCheckinRoute);
app.register(cancelCheckinRoute);

app.register(getBeltsRoute);
app.register(rankingRoute);

app.setErrorHandler((error, _, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: "Validation error",
      issues: error.flatten().fieldErrors,
    });
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(error);
  } else {
    // here we should log to a external tool like datadog, new relic or sentry
  }

  console.log(error);

  return reply.status(500).send({ message: error.message });
});

export { app };
