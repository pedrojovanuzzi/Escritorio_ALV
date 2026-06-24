import "reflect-metadata";
import AppDataSource from "./database/DataSource";
import { ensureDatabase } from "./database/ensureDatabase";

/**
 * Executa as migrations pendentes.
 * Uso:  npm run migration:run
 */
async function run() {
  try {
    await ensureDatabase();
    await AppDataSource.initialize();
    const executadas = await AppDataSource.runMigrations();
    if (executadas.length === 0) {
      console.log("✅ Nenhuma migration pendente.");
    } else {
      executadas.forEach((m) => console.log(`▶️  Executada: ${m.name}`));
    }
    await AppDataSource.destroy();
    process.exit(0);
  } catch (err) {
    console.error("❌ Erro ao rodar migrations:", err);
    process.exit(1);
  }
}

run();
