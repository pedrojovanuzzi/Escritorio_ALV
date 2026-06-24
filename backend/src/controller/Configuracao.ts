import { Request, Response } from "express";
import AppDataSource from "../database/DataSource";
import { Configuracao } from "../entities/Configuracao";
import { EMPRESA_PADRAO } from "../config/nfse";

/** Defaults usados quando ainda não há configuração salva. */
const NFSE_PADRAO = {
  ambiente: "homologacao",
  item_lista: "14.02.01",
  cnae: "6209100",
  cod_tributacao_municipio: "0000140200001",
  aliquota: "5,00",
  discriminacao: "",
  regime: "Simples Nacional — ME/EPP",
  optante_simples: true,
  iss_retido: false,
};

const BOLETO_PADRAO = {
  banco: "001 — Banco do Brasil",
  carteira: "17 — Registrada",
  especie: "DS — Duplicata de Serviço",
  multa: "2,00",
  juros: "1,00",
  desconto: "0,00",
  dias_vencimento: 30,
  instrucoes:
    "Não receber após 30 dias do vencimento. Referente à prestação de serviços.",
};

class ConfiguracaoController {
  constructor() {
    this.obter = this.obter.bind(this);
    this.salvar = this.salvar.bind(this);
  }

  /** Retorna a configuração (cria a linha única com defaults se não existir). */
  private async getOrCreate(): Promise<Configuracao> {
    const repo = AppDataSource.getRepository(Configuracao);
    let config = await repo.findOne({ where: { id: 1 } });
    if (!config) {
      config = repo.create({ id: 1, nfse: NFSE_PADRAO, boleto: BOLETO_PADRAO });
      await repo.save(config);
    }
    return config;
  }

  public async obter(_req: Request, res: Response) {
    try {
      const config = await this.getOrCreate();
      res.json({
        empresa: { ...EMPRESA_PADRAO, ...(config.empresa || {}) },
        nfse: { ...NFSE_PADRAO, ...(config.nfse || {}) },
        boleto: { ...BOLETO_PADRAO, ...(config.boleto || {}) },
        atualizado_em: config.atualizado_em,
      });
    } catch (err) {
      console.error("Erro ao obter configurações:", err);
      res.status(500).json({ errors: ["Erro ao obter configurações."] });
    }
  }

  public async salvar(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Configuracao);
      const config = await this.getOrCreate();
      const { empresa, nfse, boleto } = req.body;

      if (empresa) config.empresa = { ...EMPRESA_PADRAO, ...config.empresa, ...empresa };
      if (nfse) config.nfse = { ...NFSE_PADRAO, ...config.nfse, ...nfse };
      if (boleto) config.boleto = { ...BOLETO_PADRAO, ...config.boleto, ...boleto };

      const salvo = await repo.save(config);
      res.json({
        empresa: salvo.empresa,
        nfse: salvo.nfse,
        boleto: salvo.boleto,
        atualizado_em: salvo.atualizado_em,
      });
    } catch (err) {
      console.error("Erro ao salvar configurações:", err);
      res.status(500).json({ errors: ["Erro ao salvar configurações."] });
    }
  }
}

export default new ConfiguracaoController();
