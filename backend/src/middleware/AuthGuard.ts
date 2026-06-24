import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import AppDataSource from "../database/DataSource";
import { User } from "../entities/User";

dotenv.config();

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User | null;
    }
  }
}

const jwtSecret = String(process.env.JWT_SECRET);

async function AuthGuard(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token =
    (authHeader && authHeader.split(" ")[1]) || (req.query.token as string);

  if (!token) {
    res.status(401).json({ errors: ["Acesso negado!"] });
    return;
  }

  try {
    const verified = jwt.verify(token, jwtSecret) as JwtPayload;

    const userRepository = AppDataSource.getRepository(User);
    req.user = await userRepository.findOne({
      where: { id: verified.id },
      select: ["id", "nome", "email", "cargo"],
    });

    if (!req.user) {
      res.status(401).json({ errors: ["Usuário não encontrado"] });
      return;
    }

    next();
  } catch {
    res.status(401).json({ errors: ["Token inválido"] });
  }
}

export default AuthGuard;
