import { app } from "./app.ts";

app.listen({ host: '0.0.0.0', port: 3333 }).then(() => {
  console.log(`HTTP server running`);
});
