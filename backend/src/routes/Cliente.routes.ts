import { Router } from "express";
import multer from "multer";
import Cliente from "../controller/Cliente";
import AuthGuard from "../middleware/AuthGuard";

const router: Router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", AuthGuard, Cliente.listar);

// Importação por TXT (fixed-width)
router.post(
  "/importar-preview",
  AuthGuard,
  upload.single("arquivo"),
  Cliente.importarPreview
);
router.post("/importar", AuthGuard, Cliente.importar);

// Edição em massa (deve vir antes de "/:id" para não ser capturada por ele).
router.put("/lote", AuthGuard, Cliente.atualizarLote);

router.get("/:id", AuthGuard, Cliente.buscar);
router.post("/", AuthGuard, Cliente.criar);
router.put("/:id", AuthGuard, Cliente.atualizar);
router.delete("/:id", AuthGuard, Cliente.remover);

export default router;
