import { createServer } from "./server.js";
import { env } from "./config/env.js";

async function main(): Promise<void> {
  const app = await createServer();

  try {
    const address = await app.listen({
      port: env.PORT,
      host: env.HOST,
    });
    app.log.info(`🚀 Kekego API running at ${address}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void main();
