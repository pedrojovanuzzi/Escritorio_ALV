import "reflect-metadata";

import { App } from "./app";
import AppDataSource from "./database/DataSource";
import { ensureDatabase } from "./database/ensureDatabase";

const port = Number(process.env.PORT) || 3000;

async function bootstrap() {
  // Garante que o database exista e que o schema esteja atualizado.
  await ensureDatabase();
  await AppDataSource.initialize();
  console.log("✅ Data Source inicializado!");

  const executadas = await AppDataSource.runMigrations();
  if (executadas.length > 0) {
    executadas.forEach((m) => console.log(`▶️  Migration aplicada: ${m.name}`));
  }

  const app = new App();
  app.server.listen(port, () => {
    console.log(`🚀 Servidor Alvorada ouvindo em http://localhost:${port}`);
  });
}

bootstrap().catch((err) => {
  console.error("❌ Erro ao inicializar o servidor", err);
  process.exit(1);
});
