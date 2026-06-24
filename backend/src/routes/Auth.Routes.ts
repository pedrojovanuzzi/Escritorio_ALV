import { Router } from "express";
import Auth from "../controller/Auth";
import AuthGuard from "../middleware/AuthGuard";

const router: Router = Router();

router.post("/login", Auth.login);
router.post("/validate", AuthGuard, Auth.validate);

export default router;
