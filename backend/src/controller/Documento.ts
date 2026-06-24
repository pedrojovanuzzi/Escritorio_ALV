import { Request, Response } from "express";
import AppDataSource from "../database/DataSource";
import { Documento } from "../entities/Documento";
import NfseService from "../services/nfse/NfseService";
import BoletoService from "../services/boleto/BoletoService";

class DocumentoController {
  constructor() {
    this.listar = this.listar.bind(this);
    this.buscar = this.buscar.bind(this);
    this.emitirNfse = this.emitirNfse.bind(this);
    this.gerarBoleto = this.gerarBoleto.bind(this);
    this.emitirLote = this.emitirLote.bind(this);
    this.estatisticas = this.estatisticas.bind(this);
  }

  /** Histórico de documentos. */
  public async listar(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Documento);
      const { tipo } = req.query;
      const where = tipo ? { tipo: tipo as any } : {};
      const docs = await repo.find({ where, order: { criado_em: "DESC" } });
      res.json(docs);
    } catch (err) {
      console.error("Erro ao listar documentos:", err);
      res.status(500).json({ errors: ["Erro ao listar documentos."] });
    }
  }

  public async buscar(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Documento);
      const doc = await repo.findOne({ where: { id: Number(req.params.id) } });
      if (!doc) {
        res.status(404).json({ errors: ["Documento não encontrado."] });
        return;
      }
      res.json(doc);
    } catch (err) {
      console.error("Erro ao buscar documento:", err);
      res.status(500).json({ errors: ["Erro ao buscar documento."] });
    }
  }

  public async emitirNfse(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Documento);
      const dados = req.body;

      const resultado = await NfseService.emitir(dados);

      const doc = repo.create({
        tipo: "NFSE",
        numero: resultado.numero,
        cliente_id: dados.cliente_id,
        cliente_nome: dados.cliente_nome,
        valor: dados.valor,
        status: "Autorizada",
        codigo_verificacao: resultado.codigo_verificacao,
        dados: { ...dados, ...resultado },
      });
      const salvo = await repo.save(doc);
      res.status(201).json(salvo);
    } catch (err) {
      console.error("Erro ao emitir NFS-e:", err);
      res.status(500).json({ errors: ["Erro ao emitir NFS-e."] });
    }
  }

  public async gerarBoleto(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Documento);
      const dados = req.body;

      const resultado = await BoletoService.registrar(dados);

      const doc = repo.create({
        tipo: "BOLETO",
        numero: resultado.numero,
        cliente_id: dados.cliente_id,
        cliente_nome: dados.cliente_nome,
        valor: dados.valor,
        status: "Em aberto",
        linha_digitavel: resultado.linha_digitavel,
        dados: { ...dados, ...resultado },
      });
      const salvo = await repo.save(doc);
      res.status(201).json(salvo);
    } catch (err) {
      console.error("Erro ao gerar boleto:", err);
      res.status(500).json({ errors: ["Erro ao gerar boleto."] });
    }
  }

  /** Emissão em lote de NFS-e ou boletos. */
  public async emitirLote(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Documento);
      const { tipo, itens } = req.body as {
        tipo: "NFSE" | "BOLETO";
        itens: any[];
      };

      if (!Array.isArray(itens) || itens.length === 0) {
        res.status(400).json({ errors: ["Nenhum item informado para o lote."] });
        return;
      }

      const gerados: Documento[] = [];
      let comErro = 0;

      for (const item of itens) {
        try {
          if (tipo === "BOLETO") {
            const r = await BoletoService.registrar(item);
            gerados.push(
              repo.create({
                tipo: "BOLETO",
                numero: r.numero,
                cliente_id: item.cliente_id,
                cliente_nome: item.cliente_nome,
                valor: item.valor,
                status: "Em aberto",
                linha_digitavel: r.linha_digitavel,
                dados: { ...item, ...r },
              })
            );
          } else {
            const r = await NfseService.emitir(item);
            gerados.push(
              repo.create({
                tipo: "NFSE",
                numero: r.numero,
                cliente_id: item.cliente_id,
                cliente_nome: item.cliente_nome,
                valor: item.valor,
                status: "Autorizada",
                codigo_verificacao: r.codigo_verificacao,
                dados: { ...item, ...r },
              })
            );
          }
        } catch {
          comErro++;
        }
      }

      const salvos = await repo.save(gerados);
      const total = salvos.reduce((a, d) => a + Number(d.valor || 0), 0);

      res.status(201).json({
        gerados: salvos.length,
        com_erro: comErro,
        valor_total: total,
        documentos: salvos,
      });
    } catch (err) {
      console.error("Erro na emissão em lote:", err);
      res.status(500).json({ errors: ["Erro na emissão em lote."] });
    }
  }

  /** Cards de resumo do histórico. */
  public async estatisticas(_req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Documento);
      const docs = await repo.find();

      const nfse = docs.filter((d) => d.tipo === "NFSE");
      const boletos = docs.filter((d) => d.tipo === "BOLETO");
      const emAberto = boletos.filter(
        (d) => d.status === "Em aberto" || d.status === "Vencido"
      );

      res.json({
        nfse_emitidas: nfse.length,
        boletos_gerados: boletos.length,
        valor_faturado: docs.reduce((a, d) => a + Number(d.valor || 0), 0),
        em_aberto: emAberto.reduce((a, d) => a + Number(d.valor || 0), 0),
        em_aberto_qtd: emAberto.length,
      });
    } catch (err) {
      console.error("Erro ao calcular estatísticas:", err);
      res.status(500).json({ errors: ["Erro ao calcular estatísticas."] });
    }
  }
}

export default new DocumentoController();
