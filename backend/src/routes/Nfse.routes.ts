import { Router } from "express";
import multer from "multer";
import Certificado from "../controller/Certificado";
import AuthGuard from "../middleware/AuthGuard";

const router: Router = Router();

// Mantém o .pfx em memória para gravar no caminho de destino.
const upload = multer({ storage: multer.memoryStorage() });

router.get("/certificado/status", AuthGuard, Certificado.status);
router.post(
  "/certificado",
  AuthGuard,
  upload.single("certificado"),
  Certificado.upload
);

export default router;
