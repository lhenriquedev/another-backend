import { app } from "./app";

const port = Number(process.env.PORT) || 3333;

app.get('/health', async () => {
  return { status: 'ok' }
})

app.listen({ port, host: '0.0.0.0' }).then(() => {
  console.log(`HTTP server running`);
}).catch(err => {
  app.log.error(err)
  process.exit(1)
});
