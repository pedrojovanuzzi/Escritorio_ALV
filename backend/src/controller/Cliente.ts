import { Request, Response } from "express";
import AppDataSource from "../database/DataSource";
import { Cliente } from "../entities/Cliente";
import { parseClientesTxt } from "../services/clientes/ClientesTxtParser";

class ClienteController {
  constructor() {
    this.listar = this.listar.bind(this);
    this.buscar = this.buscar.bind(this);
    this.criar = this.criar.bind(this);
    this.atualizar = this.atualizar.bind(this);
    this.remover = this.remover.bind(this);
    this.importarPreview = this.importarPreview.bind(this);
    this.importar = this.importar.bind(this);
    this.atualizarLote = this.atualizarLote.bind(this);
  }

  /**
   * Atualiza vários clientes de uma vez com os mesmos dados (edição em massa).
   * Só aplica os campos enviados e não vazios — campos em branco preservam o
   * valor já existente de cada cliente.
   */
  public async atualizarLote(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Cliente);
      const { ids, patch } = req.body as { ids: number[]; patch: Record<string, any> };

      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ errors: ["Selecione ao menos um cliente."] });
        return;
      }

      // Campos liberados para edição em massa (dados de serviço/NFS-e).
      const PERMITIDOS = [
        "item_lista",
        "cnae",
        "aliquota",
        "regime",
        "cod_tributacao_municipio",
        "discriminacao",
      ];
      const limpo: Record<string, any> = {};
      for (const campo of PERMITIDOS) {
        const v = patch?.[campo];
        if (v !== undefined && String(v).trim() !== "") limpo[campo] = v;
      }

      if (Object.keys(limpo).length === 0) {
        res.status(400).json({ errors: ["Informe ao menos um campo para aplicar."] });
        return;
      }

      await repo.update(ids, limpo);
      res.json({ atualizados: ids.length, campos: Object.keys(limpo) });
    } catch (err) {
      console.error("Erro ao atualizar clientes em lote:", err);
      res.status(500).json({ errors: ["Erro ao atualizar clientes em lote."] });
    }
  }

  /** Lê um TXT, e compara com o cadastro existente marcando Novo/Alterado/Igual. */
  public async importarPreview(req: Request, res: Response) {
    try {
      if (!req.file) {
        res.status(400).json({ errors: ["Envie o arquivo no campo 'arquivo'."] });
        return;
      }
      const resultado = parseClientesTxt(req.file.buffer);
      const { porCodigo, porDoc } = await carregarIndices();

      let novos = 0;
      let alterados = 0;
      let iguais = 0;

      const clientes = resultado.clientes.map((c) => {
        const existente = acharExistente(c, porCodigo, porDoc);
        if (!existente) {
          novos++;
          return { ...c, status: "novo" as const, alteracoes: [] };
        }
        const { alteracoes } = diffCliente(existente, c);
        if (alteracoes.length) {
          alterados++;
          return { ...c, status: "alterado" as const, alteracoes };
        }
        iguais++;
        return { ...c, status: "igual" as const, alteracoes: [] };
      });

      res.json({ ...resultado, clientes, resumo: { novos, alterados, iguais } });
    } catch (err) {
      console.error("Erro ao ler TXT de clientes:", err);
      res.status(500).json({ errors: ["Erro ao interpretar o arquivo."] });
    }
  }

  /** Aplica a importação: insere novos e atualiza os alterados (casados por código/doc). */
  public async importar(req: Request, res: Response) {
    try {
      const repo = AppDataSource.getRepository(Cliente);
      const { clientes } = req.body as { clientes: any[] };

      if (!Array.isArray(clientes) || clientes.length === 0) {
        res.status(400).json({ errors: ["Nenhum cliente para importar."] });
        return;
      }

      const { porCodigo, porDoc } = await carregarIndices();

      let inseridos = 0;
      let atualizados = 0;
      let inalterados = 0;
      let ignorados = 0;
      const mudancas: Array<{
        codigo: string;
        nome: string;
        alteracoes: Array<{ campo: string; de: string; para: string }>;
      }> = [];

      for (const c of clientes) {
        const nome = (c.nome || "").trim();
        if (!nome) {
          ignorados++;
          continue;
        }
        const doc = String(c.doc || "").replace(/\D/g, "");
        const tipo = doc.length === 11 ? "PF" : "PJ";
        const existente = acharExistente(c, porCodigo, porDoc);

        if (!existente) {
          await repo.save(
            repo.create({
              codigo_externo: c.codigo || undefined,
              nome,
              nome_fantasia: c.fantasia || undefined,
              doc,
              telefone: c.telefone || undefined,
              email: c.email || undefined,
              inscricao_municipal: c.inscricao_municipal || undefined,
              inscricao_estadual: c.inscricao_estadual || undefined,
              cnae: c.cnae || undefined,
              contador: c.contador || undefined,
              responsavel_legal: c.responsavel_legal || undefined,
              natureza_juridica: c.natureza_juridica || undefined,
              capital_social: c.capital_social || undefined,
              tipo,
              endereco: c.endereco || undefined,
              numero: c.numero || undefined,
              complemento: c.complemento || undefined,
              bairro: c.bairro || undefined,
              municipio: c.cidade || undefined,
              uf: c.uf || undefined,
              cep: c.cep || undefined,
            })
          );
          inseridos++;
          continue;
        }

        const { alteracoes, patch } = diffCliente(existente, c);
        // Vincula o código de origem se ainda não tiver.
        if (c.codigo && !existente.codigo_externo) patch.codigo_externo = String(c.codigo);

        if (alteracoes.length || patch.codigo_externo) {
          repo.merge(existente, patch);
          await repo.save(existente);
        }

        if (alteracoes.length) {
          atualizados++;
          mudancas.push({ codigo: String(c.codigo || ""), nome, alteracoes });
        } else {
          inalterados++;
        }
      }

      res.status(201).json({
        inseridos,
        atualizados,
        inalterados,
        ignorados,
        total: clientes.length,
        mudancas,
      });
    } catch (err) {
      console.error("Erro ao importar clientes:", err);
      res.status(500).json({ errors: ["Erro ao importar clientes."] });
    }
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

/* --------------------------- helpers de import --------------------------- */

const soDigitos = (s: any) => String(s ?? "").replace(/\D/g, "");

/** Carrega o cadastro atual em índices por código de origem e por documento. */
async function carregarIndices() {
  const repo = AppDataSource.getRepository(Cliente);
  const todos = await repo.find();
  const porCodigo = new Map<string, Cliente>();
  const porDoc = new Map<string, Cliente>();
  for (const c of todos) {
    if (c.codigo_externo) porCodigo.set(String(c.codigo_externo).trim(), c);
    const d = soDigitos(c.doc);
    if (d) porDoc.set(d, c);
  }
  return { porCodigo, porDoc };
}

/** Acha o cliente existente: primeiro pelo código de origem, depois pelo documento. */
function acharExistente(
  novo: any,
  porCodigo: Map<string, Cliente>,
  porDoc: Map<string, Cliente>
): Cliente | null {
  const cod = String(novo.codigo ?? "").trim();
  if (cod && porCodigo.has(cod)) return porCodigo.get(cod)!;
  const doc = soDigitos(novo.doc);
  if (doc && porDoc.has(doc)) return porDoc.get(doc)!;
  return null;
}

// Mapa campo-do-import -> coluna-do-cadastro.
const CAMPOS_DIFF: Array<[string, keyof Cliente]> = [
  ["nome", "nome"],
  ["fantasia", "nome_fantasia"],
  ["doc", "doc"],
  ["telefone", "telefone"],
  ["email", "email"],
  ["inscricao_municipal", "inscricao_municipal"],
  ["inscricao_estadual", "inscricao_estadual"],
  ["cnae", "cnae"],
  ["contador", "contador"],
  ["responsavel_legal", "responsavel_legal"],
  ["natureza_juridica", "natureza_juridica"],
  ["capital_social", "capital_social"],
  ["endereco", "endereco"],
  ["numero", "numero"],
  ["complemento", "complemento"],
  ["bairro", "bairro"],
  ["cidade", "municipio"],
  ["uf", "uf"],
  ["cep", "cep"],
];

/**
 * Compara o cliente do import com o existente.
 * Só considera campos que o import realmente trouxe (não apaga dado existente com vazio).
 * Documento é comparado por dígitos (ignora máscara).
 */
function diffCliente(existente: Cliente, novo: any) {
  const alteracoes: Array<{ campo: string; de: string; para: string }> = [];
  const patch: any = {};
  for (const [src, col] of CAMPOS_DIFF) {
    let val = String(novo[src] ?? "").trim();
    if (!val) continue; // import não forneceu => mantém o que já existe
    let atual = String((existente as any)[col] ?? "").trim();
    if (col === "doc") {
      val = soDigitos(val);
      atual = soDigitos(atual);
    }
    if (val !== atual) {
      alteracoes.push({ campo: String(col), de: atual, para: val });
      patch[col] = val;
    }
  }
  return { alteracoes, patch };
}

export default new ClienteController();
