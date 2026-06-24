import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import AppDataSource from "../database/DataSource";
import { User } from "../entities/User";

dotenv.config();

const jwtSecret = String(process.env.JWT_SECRET);
const expiresIn = process.env.JWT_EXPIRES_IN || "8h";

function gerarToken(user: User) {
  return jwt.sign({ id: user.id, email: user.email }, jwtSecret, {
    expiresIn: expiresIn as any,
  });
}

class AuthController {
  constructor() {
    this.login = this.login.bind(this);
    this.validate = this.validate.bind(this);
  }

  public async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ errors: ["E-mail e senha são obrigatórios."] });
        return;
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { email },
        select: ["id", "nome", "email", "cargo", "password"],
      });

      if (!user || !user.password) {
        res.status(401).json({ errors: ["Credenciais inválidas."] });
        return;
      }

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) {
        res.status(401).json({ errors: ["Credenciais inválidas."] });
        return;
      }

      const token = gerarToken(user);
      res.json({
        token,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          cargo: user.cargo,
        },
      });
    } catch (err) {
      console.error("Erro no login:", err);
      res.status(500).json({ errors: ["Erro ao efetuar login."] });
    }
  }

  // Revalida o token e devolve os dados do usuário (usado no boot do front).
  public async validate(req: Request, res: Response) {
    res.json({ valid: true, user: req.user });
  }
}

export default new AuthController();
