import { Request, Response } from "express";
import { Between, MoreThanOrEqual, LessThanOrEqual } from "typeorm";
import AppDataSource from "../database/DataSource";
import { Documento } from "../entities/Documento";
import NfseService from "../services/nfse/NfseService";
import BoletoService from "../services/boleto/BoletoService";
import { getEmpresa, getNfseConfig } from "../services/configuracao/EmpresaConfig";

class DocumentoController {
  constructor() {
    this.listar = this.listar.bind(this);
    this.buscar = this.buscar.bind(this);
    this.emitirNfse = this.emitirNfse.bind(this);
    this.gerarBoleto = this.gerarBoleto.bind(this);
    this.emitirLote = this.emitirLote.bind(this);
    this.estatisticas = this.estatisticas.bind(this);
    this.proximoRps = this.proximoRps.bind(this);
    this.sincronizarRps = this.sincronizarRps.bind(this);
  }

  /** Sincroniza o próximo RPS consultando as NFS-e emitidas na prefeitura. */
  public async sincronizarRps(req: Request, res: Response) {
    try {
      const { certPassword, numeroNfse } = (req.body || {}) as {
        certPassword?: string;
        numeroNfse?: number | string;
      };
      const r = await NfseService.sincronizarRps(
        certPassword,
        Number(numeroNfse) || 0
      );
      res.json(r);
    } catch (err: any) {
      console.error("Erro ao sincronizar RPS:", err?.message || err);
      res.status(500).json({
        errors: ["Erro ao sincronizar RPS: " + (err?.message || "falha desconhecida")],
      });
    }
  }

  /** Próximo número de RPS configurado (e o último gerado = próximo - 1). */
  public async proximoRps(_req: Request, res: Response) {
    try {
      const cfg = await getNfseConfig();
      const proximo = Number(cfg.proximo_rps) || 1;
      res.json({ proximo_rps: proximo, ultimo_rps: Math.max(0, proximo - 1) });
    } catch (err) {
      console.error("Erro ao obter próximo RPS:", err);
      res.status(500).json({ errors: ["Erro ao obter próximo RPS."] });
    }
  }

  /**
   * Histórico de documentos com filtros opcionais:
   * - tipo: NFSE | BOLETO
   * - status: Autorizada | Em aberto | Pago | Vencido | Cancelada | Rascunho
   * - data_inicio / data_fim (YYYY-MM-DD) sobre a data de criação
   */
  public async listar(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Documento);
      const { tipo, status, data_inicio, data_fim } = req.query as Record<
        string,
        string
      >;

      const where: any = {};
      if (tipo) where.tipo = tipo;
      if (status) where.status = status;

      // Filtro por período (data de criação).
      const inicio = data_inicio ? new Date(`${data_inicio}T00:00:00`) : null;
      const fim = data_fim ? new Date(`${data_fim}T23:59:59.999`) : null;
      if (inicio && fim) where.criado_em = Between(inicio, fim);
      else if (inicio) where.criado_em = MoreThanOrEqual(inicio);
      else if (fim) where.criado_em = LessThanOrEqual(fim);

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
      const ambiente = dados.ambiente === "producao" ? "producao" : "homologacao";

      const resultado = await NfseService.emitir({ ...dados, ambiente });

      // Se foi transmitida ao webservice => Autorizada; caso contrário, Rascunho (RPS montado).
      // Só é "Autorizada" se a prefeitura confirmou; se transmitiu mas rejeitou => "Rejeitada".
      const status = resultado.autorizada
        ? "Autorizada"
        : resultado.enviado
        ? "Rejeitada"
        : "Rascunho";

      const doc = repo.create({
        tipo: "NFSE",
        numero: resultado.numero,
        cliente_id: dados.cliente_id,
        cliente_nome: dados.cliente_nome,
        valor: dados.valor,
        status,
        ambiente,
        codigo_verificacao: resultado.codigo_verificacao,
        // não persistir a senha do certificado
        dados: { ...dados, certPassword: undefined, ...resultado },
      });
      const salvo = await repo.save(doc);

      res.status(201).json({
        ...salvo,
        enviado: resultado.enviado,
        autorizada: resultado.autorizada,
        mensagens: resultado.mensagens,
        aviso: resultado.aviso,
      });
    } catch (err: any) {
      console.error("Erro ao emitir NFS-e:", err?.message || err);
      res
        .status(500)
        .json({ errors: ["Erro ao emitir NFS-e: " + (err?.message || "falha desconhecida")] });
    }
  }

  public async gerarBoleto(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Documento);
      const dados = req.body;

      const resultado = await BoletoService.registrar(dados);
      const beneficiario = await getEmpresa();

      const doc = repo.create({
        tipo: "BOLETO",
        numero: resultado.numero,
        cliente_id: dados.cliente_id,
        cliente_nome: dados.cliente_nome,
        valor: dados.valor,
        status: "Em aberto",
        linha_digitavel: resultado.linha_digitavel,
        dados: { ...dados, ...resultado, beneficiario },
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
