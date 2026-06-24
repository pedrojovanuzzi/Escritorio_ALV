import { Router } from "express";
import Cliente from "../controller/Cliente";
import AuthGuard from "../middleware/AuthGuard";

const router: Router = Router();

router.get("/", AuthGuard, Cliente.listar);
router.get("/:id", AuthGuard, Cliente.buscar);
router.post("/", AuthGuard, Cliente.criar);
router.put("/:id", AuthGuard, Cliente.atualizar);
router.delete("/:id", AuthGuard, Cliente.remover);

export default router;
