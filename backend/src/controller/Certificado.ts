import { Request, Response } from "express";
import * as fs from "fs";
import { CERT_PATH, CERT_DIR } from "../config/nfse";
import NfseService from "../services/nfse/NfseService";

class CertificadoController {
  constructor() {
    this.upload = this.upload.bind(this);
    this.status = this.status.bind(this);
  }

  /** Recebe o .pfx (campo "certificado") e salva como files/certificado.pfx. */
  public async upload(req: Request, res: Response) {
    try {
      if (!req.file) {
        res.status(400).json({ errors: ["Nenhum arquivo enviado (campo 'certificado')."] });
        return;
      }
      if (!fs.existsSync(CERT_DIR)) fs.mkdirSync(CERT_DIR, { recursive: true });
      fs.writeFileSync(CERT_PATH, req.file.buffer);
      res.json({
        ok: true,
        mensagem: "Certificado A1 salvo com sucesso.",
        caminho: CERT_PATH,
      });
    } catch (err) {
      console.error("Erro ao salvar certificado:", err);
      res.status(500).json({ errors: ["Erro ao salvar o certificado."] });
    }
  }

  /** Informa se já existe um certificado configurado. */
  public async status(_req: Request, res: Response) {
    res.json({
      configurado: NfseService.certificadoConfigurado(),
      caminho: CERT_PATH,
    });
  }
}

export default new CertificadoController();
