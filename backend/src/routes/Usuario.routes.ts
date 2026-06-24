import { Router } from "express";
import Usuario from "../controller/Usuario";
import AuthGuard from "../middleware/AuthGuard";

const router: Router = Router();

router.get("/", AuthGuard, Usuario.listar);
router.post("/", AuthGuard, Usuario.criar);
router.put("/:id", AuthGuard, Usuario.atualizar);
router.delete("/:id", AuthGuard, Usuario.remover);

export default router;
