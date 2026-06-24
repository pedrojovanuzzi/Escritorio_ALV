import { Router } from "express";
import Configuracao from "../controller/Configuracao";
import AuthGuard from "../middleware/AuthGuard";

const router: Router = Router();

router.get("/", AuthGuard, Configuracao.obter);
router.put("/", AuthGuard, Configuracao.salvar);

export default router;
