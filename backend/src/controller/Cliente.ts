import { Request, Response } from "express";
import AppDataSource from "../database/DataSource";
import { Cliente } from "../entities/Cliente";

class ClienteController {
  constructor() {
    this.listar = this.listar.bind(this);
    this.buscar = this.buscar.bind(this);
    this.criar = this.criar.bind(this);
    this.atualizar = this.atualizar.bind(this);
    this.remover = this.remover.bind(this);
  }

  public async listar(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Cliente);
      const { tipo } = req.query;
      const where = tipo ? { tipo: tipo as any } : {};
      const clientes = await repo.find({ where, order: { nome: "ASC" } });
      res.json(clientes);
    } catch (err) {
      console.error("Erro ao listar clientes:", err);
      res.status(500).json({ errors: ["Erro ao listar clientes."] });
    }
  }

  public async buscar(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Cliente);
      const cliente = await repo.findOne({ where: { id: Number(req.params.id) } });
      if (!cliente) {
        res.status(404).json({ errors: ["Cliente não encontrado."] });
        return;
      }
      res.json(cliente);
    } catch (err) {
      console.error("Erro ao buscar cliente:", err);
      res.status(500).json({ errors: ["Erro ao buscar cliente."] });
    }
  }

  public async criar(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Cliente);
      const { nome, doc } = req.body;
      if (!nome || !doc) {
        res.status(400).json({ errors: ["Nome e documento são obrigatórios."] });
        return;
      }
      const cliente = repo.create(req.body);
      const salvo = await repo.save(cliente);
      res.status(201).json(salvo);
    } catch (err) {
      console.error("Erro ao criar cliente:", err);
      res.status(500).json({ errors: ["Erro ao criar cliente."] });
    }
  }

  public async atualizar(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Cliente);
      const id = Number(req.params.id);
      const cliente = await repo.findOne({ where: { id } });
      if (!cliente) {
        res.status(404).json({ errors: ["Cliente não encontrado."] });
        return;
      }
      repo.merge(cliente, req.body);
      const salvo = await repo.save(cliente);
      res.json(salvo);
    } catch (err) {
      console.error("Erro ao atualizar cliente:", err);
      res.status(500).json({ errors: ["Erro ao atualizar cliente."] });
    }
  }

  public async remover(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Cliente);
      await repo.delete({ id: Number(req.params.id) });
      res.json({ ok: true });
    } catch (err) {
      console.error("Erro ao remover cliente:", err);
      res.status(500).json({ errors: ["Erro ao remover cliente."] });
    }
  }
}

export default new ClienteController();
