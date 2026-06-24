import { Router } from "express";
import Documento from "../controller/Documento";
import AuthGuard from "../middleware/AuthGuard";

const router: Router = Router();

router.get("/", AuthGuard, Documento.listar);
router.get("/estatisticas", AuthGuard, Documento.estatisticas);
router.get("/:id", AuthGuard, Documento.buscar);

router.post("/nfse", AuthGuard, Documento.emitirNfse);
router.post("/boleto", AuthGuard, Documento.gerarBoleto);
router.post("/lote", AuthGuard, Documento.emitirLote);

export default router;
