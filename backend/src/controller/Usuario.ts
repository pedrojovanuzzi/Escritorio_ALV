import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { Not } from "typeorm";
import AppDataSource from "../database/DataSource";
import { User } from "../entities/User";

class UsuarioController {
  constructor() {
    this.listar = this.listar.bind(this);
    this.criar = this.criar.bind(this);
    this.atualizar = this.atualizar.bind(this);
    this.remover = this.remover.bind(this);
  }

  /** Lista os usuários (sem a senha). */
  public async listar(_req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(User);
      const users = await repo.find({
        select: ["id", "nome", "email", "cargo", "criado_em"],
        order: { nome: "ASC" },
      });
      res.json(users);
    } catch (err) {
      console.error("Erro ao listar usuários:", err);
      res.status(500).json({ errors: ["Erro ao listar usuários."] });
    }
  }

  /** Cria um novo usuário. */
  public async criar(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(User);
      const { nome, email, password, cargo } = req.body;

      if (!nome || !email || !password) {
        res.status(400).json({ errors: ["Nome, e-mail e senha são obrigatórios."] });
        return;
      }
      if (String(password).length < 6) {
        res.status(400).json({ errors: ["A senha deve ter ao menos 6 caracteres."] });
        return;
      }

      const jaExiste = await repo.findOne({ where: { email } });
      if (jaExiste) {
        res.status(409).json({ errors: ["Já existe um usuário com este e-mail."] });
        return;
      }

      const user = repo.create({
        nome,
        email,
        cargo: cargo || "Contador",
        password: await bcrypt.hash(password, 10),
      });
      const salvo = await repo.save(user);
      res.status(201).json({
        id: salvo.id,
        nome: salvo.nome,
        email: salvo.email,
        cargo: salvo.cargo,
        criado_em: salvo.criado_em,
      });
    } catch (err) {
      console.error("Erro ao criar usuário:", err);
      res.status(500).json({ errors: ["Erro ao criar usuário."] });
    }
  }

  /** Atualiza um usuário (a senha só é trocada se enviada). */
  public async atualizar(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(User);
      const id = Number(req.params.id);
      const { nome, email, password, cargo } = req.body;

      const user = await repo.findOne({ where: { id } });
      if (!user) {
        res.status(404).json({ errors: ["Usuário não encontrado."] });
        return;
      }

      if (email && email !== user.email) {
        const emailEmUso = await repo.findOne({ where: { email, id: Not(id) } });
        if (emailEmUso) {
          res.status(409).json({ errors: ["Já existe um usuário com este e-mail."] });
          return;
        }
      }

      if (nome) user.nome = nome;
      if (email) user.email = email;
      if (cargo) user.cargo = cargo;
      if (password) {
        if (String(password).length < 6) {
          res.status(400).json({ errors: ["A senha deve ter ao menos 6 caracteres."] });
          return;
        }
        user.password = await bcrypt.hash(password, 10);
      }

      const salvo = await repo.save(user);
      res.json({
        id: salvo.id,
        nome: salvo.nome,
        email: salvo.email,
        cargo: salvo.cargo,
        criado_em: salvo.criado_em,
      });
    } catch (err) {
      console.error("Erro ao atualizar usuário:", err);
      res.status(500).json({ errors: ["Erro ao atualizar usuário."] });
    }
  }

  /** Remove um usuário (não permite remover a própria conta). */
  public async remover(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(User);
      const id = Number(req.params.id);

      if (req.user?.id === id) {
        res.status(400).json({ errors: ["Você não pode remover a sua própria conta."] });
        return;
      }

      await repo.delete({ id });
      res.json({ ok: true });
    } catch (err) {
      console.error("Erro ao remover usuário:", err);
      res.status(500).json({ errors: ["Erro ao remover usuário."] });
    }
  }
}

export default new UsuarioController();
