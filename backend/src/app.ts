import express from "express";
import cors from "cors";

// Routes
import Auth from "./routes/Auth.Routes";
import Cliente from "./routes/Cliente.routes";
import Documento from "./routes/Documento.routes";
import Nfse from "./routes/Nfse.routes";

export class App {
  public server: express.Application;

  constructor() {
    this.server = express();
    this.middleware();
    this.router();
  }

  private middleware() {
    this.server.use(cors());
    this.server.use(express.json());
    this.server.use(express.urlencoded({ extended: true }));
  }

  private router() {
    this.server.get("/api/health", (_req, res) => {
      res.json({ status: "ok", servico: "Sistema Fiscal Alvorada" });
    });

    this.server.use("/api/auth", Auth);
    this.server.use("/api/clientes", Cliente);
    this.server.use("/api/documentos", Documento);
    this.server.use("/api/nfse", Nfse);
  }
}
