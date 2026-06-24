import "reflect-metadata";

import { App } from "./app";
import AppDataSource from "./database/DataSource";

const port = Number(process.env.PORT) || 3000;

AppDataSource.initialize()
  .then(() => {
    console.log("✅ Data Source inicializado!");

    const app = new App();
    app.server.listen(port, () => {
      console.log(`🚀 Servidor Alvorada ouvindo em http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("❌ Erro ao inicializar o Data Source", err);
  });
