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
  const server = app.server.listen(port, () => {
    console.log(`🚀 Servidor Alvorada ouvindo em http://localhost:${port}`);
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `\n⚠️  A porta ${port} já está em uso — provavelmente há outra instância do backend rodando.\n` +
          `   • Feche o outro terminal que está com o servidor aberto, ou\n` +
          `   • Use outra porta:  set PORT=3001 && npm start  (Windows)\n` +
          `   Para liberar a porta ${port} no Windows:\n` +
          `     netstat -ano | findstr :${port}\n` +
          `     taskkill /PID <PID> /F\n`
      );
      process.exit(1);
    }
    console.error("❌ Erro no servidor:", err);
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error("❌ Erro ao inicializar o servidor", err);
  process.exit(1);
});
