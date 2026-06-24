import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { parseStringPromise, processors } from "xml2js";
import {
  Ambiente,
  CERT_PATH,
  CERT_PASSWORD,
  TEMP_DIR,
  getWsdlUrl,
  PRESTADOR,
  WS_CREDENCIAIS,
} from "../../config/nfse";
import { codigoIbge } from "../../utils/municipios";
import { getEmpresa } from "../configuracao/EmpresaConfig";
import { NfseXmlFactory, DadosRps } from "./NfseXmlFactory";
import { FiorilliProvider } from "./FiorilliProvider";

export interface TomadorNfse {
  doc: string;
  nome: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string; // código IBGE do município
  uf?: string;
  cep?: string;
  telefone?: string;
  email?: string;
}

export interface DadosNfse {
  ambiente: Ambiente;
  cliente_id?: number;
  cliente_nome?: string;
  valor: number;
  aliquota?: number; // %
  discriminacao?: string;
  item_lista?: string;
  competencia?: string;
  numeroRps?: number;
  serieRps?: string;
  optanteSimples?: boolean;
  issRetido?: boolean;
  tomador: TomadorNfse;
  certPassword?: string; // senha do certificado (se não vier, usa a do .env)
  [key: string]: any;
}

export interface ResultadoNfse {
  ambiente: Ambiente;
  numero: string;
  codigo_verificacao: string;
  valor_iss: number;
  valor_liquido: number;
  emitida_em: string;
  xmlAssinado: string;
  enviado: boolean; // true se foi transmitido ao webservice
  autorizada?: boolean; // true se a prefeitura efetivamente autorizou a NFS-e
  mensagens?: Array<{ codigo?: string; mensagem?: string; correcao?: string }>;
  retornoWebservice?: any; // resposta crua/parseada do webservice
  aviso?: string; // mensagem quando o envio não pôde ser feito
  prestador?: any; // dados da empresa emitente (para exibição no documento)
}

/** Procura recursivamente todos os valores de uma tag (pelo nome local). */
function coletar(obj: any, nome: string): any[] {
  const alvo = nome.toLowerCase();
  const achados: any[] = [];
  const walk = (o: any) => {
    if (!o || typeof o !== "object") return;
    for (const k of Object.keys(o)) {
      if (k.toLowerCase() === alvo) {
        const v = o[k];
        if (Array.isArray(v)) achados.push(...v);
        else achados.push(v);
      }
      walk(o[k]);
    }
  };
  walk(obj);
  return achados;
}

const txt = (v: any): string =>
  v == null ? "" : typeof v === "object" ? txt(v._ ?? v["#text"] ?? "") : String(v).trim();

function gerarCodigoVerificacao(): string {
  return Math.random().toString(36).slice(2, 11).toUpperCase();
}

let sequencialRps = 4903;

class NfseService {
  private xmlFactory = new NfseXmlFactory();

  /** Indica se há certificado configurado para assinar/enviar. */
  certificadoConfigurado(): boolean {
    return fs.existsSync(CERT_PATH);
  }

  /**
   * Emite uma NFS-e no ambiente informado (homologacao | producao).
   * - Monta o RPS ABRASF, assina com o certificado A1 e (se possível) envia ao webservice.
   * - Se o certificado/senha não estiverem configurados, devolve o XML montado
   *   sem assinar e marca enviado=false com um aviso (envio plugável).
   */
  async emitir(dados: DadosNfse): Promise<ResultadoNfse> {
    const ambiente: Ambiente = dados.ambiente === "producao" ? "producao" : "homologacao";
    const aliquota = dados.aliquota ?? 5;
    const valorIss = +(dados.valor * (aliquota / 100)).toFixed(2);

    const numeroRps = dados.numeroRps ?? ++sequencialRps;
    const uuidLanc = uuidv4().replace(/-/g, "").slice(0, 20);
    const t = dados.tomador;

    // Empresa emitente (prestador) — configurável em Configurações → Empresa.
    const empresa = await getEmpresa();
    const soDig = (s: any) => String(s ?? "").replace(/\D/g, "");
    // Deriva o código IBGE do município/UF da empresa; o campo código_municipio
    // serve apenas como override quando o nome não resolver.
    const prestadorCodMun =
      codigoIbge(empresa.municipio, empresa.uf) ||
      (/^\d+$/.test(empresa.codigo_municipio || "") ? empresa.codigo_municipio : "") ||
      PRESTADOR.codigoMunicipio;
    const prestador = {
      cnpj: soDig(empresa.cnpj) || PRESTADOR.cnpj,
      inscricaoMunicipal: empresa.inscricao_municipal || PRESTADOR.inscricaoMunicipal,
      cnae: soDig(dados.cnae) || soDig(empresa.cnae) || PRESTADOR.cnae,
    };
    // O XML exige o código IBGE do município. Se já vier numérico, usa direto;
    // senão resolve a partir do nome da cidade + UF; senão cai no do prestador.
    let tomadorCodMun: string;
    let avisoMunicipio = "";
    if (/^\d+$/.test(t.municipio || "")) {
      tomadorCodMun = t.municipio as string;
    } else {
      const cod = codigoIbge(t.municipio, t.uf);
      tomadorCodMun = cod || PRESTADOR.codigoMunicipio;
      if (!cod && t.municipio) {
        avisoMunicipio = `Município "${t.municipio}/${t.uf || "?"}" não encontrado na base do IBGE; foi usado o código do prestador. Confira o cadastro do cliente.`;
      }
    }

    const dadosRps: DadosRps = {
      prestador,
      uuidLanc,
      numeroRps,
      serieRps: dados.serieRps || "1",
      tipoRps: 1,
      dataEmissao: new Date(),
      status: 1,
      valorServicos: dados.valor,
      aliquota: aliquota.toFixed(4),
      issRetido: dados.issRetido ? 1 : 2,
      responsavelRetencao: dados.issRetido ? 1 : 2,
      itemListaServico: dados.item_lista || "14.02",
      discriminacao: (dados.discriminacao || "Prestação de serviços").replace(/[<>&]/g, " "),
      codigoMunicipio: prestadorCodMun,
      exigibilidadeIss: 1,
      tomadorCpfCnpj: t.doc || "",
      tomadorRazaoSocial: t.nome || "",
      tomadorEndereco: t.endereco || "",
      tomadorNumero: t.numero || "",
      tomadorComplemento: t.complemento || "",
      tomadorBairro: t.bairro || "",
      tomadorCodigoMunicipio: tomadorCodMun,
      tomadorUf: t.uf || "SP",
      tomadorCep: t.cep || "",
      tomadorTelefone: t.telefone || "",
      tomadorEmail: t.email || "",
      regimeEspecial: ambiente === "producao" ? "6" : "",
      optanteSimples: dados.optanteSimples === false ? 2 : 1,
      incentivoFiscal: 2,
    };

    const rpsXml = this.xmlFactory.createRpsXml(dadosRps);

    const base: ResultadoNfse = {
      ambiente,
      numero: String(numeroRps),
      codigo_verificacao: gerarCodigoVerificacao(),
      valor_iss: valorIss,
      valor_liquido: +dados.valor.toFixed(2),
      emitida_em: new Date().toISOString(),
      xmlAssinado: rpsXml,
      enviado: false,
      prestador: { ...empresa, codigo_municipio: prestadorCodMun },
    };

    if (avisoMunicipio) base.aviso = avisoMunicipio;

    const senha = dados.certPassword || CERT_PASSWORD;

    // Sem certificado ou sem senha: devolve o RPS montado, pronto para envio.
    if (!this.certificadoConfigurado() || !senha) {
      const certMsg = !this.certificadoConfigurado()
        ? "Certificado A1 não encontrado. Faça o upload em /api/nfse/certificado para transmitir ao webservice."
        : "Senha do certificado não configurada (NFSE_CERT_PASSWORD). RPS montado, mas não transmitido.";
      base.aviso = [avisoMunicipio, certMsg].filter(Boolean).join(" ");
      return base;
    }

    // Assina e envia.
    const provider = new FiorilliProvider(CERT_PATH, TEMP_DIR, getWsdlUrl(ambiente));
    // Assina o elemento InfDeclaracaoPrestacaoServico (o Id "RPS..." vira o URI da referência).
    const xmlAssinado = provider.assinarXml(rpsXml, "InfDeclaracaoPrestacaoServico", senha);
    base.xmlAssinado = xmlAssinado;

    const loteXml = this.xmlFactory.createLoteXml(`LOTE${uuidLanc}`, 1, xmlAssinado, prestador);
    const soap = this.xmlFactory.createEnviarLoteSoap(
      loteXml,
      WS_CREDENCIAIS.username,
      WS_CREDENCIAIS.password
    );

    const retorno = await provider.sendSoapRequest(
      soap,
      "recepcionarLoteRpsSincrono",
      senha
    );

    let parsed: any = retorno;
    try {
      parsed = await parseStringPromise(retorno, {
        explicitArray: false,
        tagNameProcessors: [processors.stripPrefix],
      });
    } catch {
      /* mantém retorno cru se não for XML */
    }

    base.enviado = true;
    base.retornoWebservice = parsed;

    // Interpreta a resposta da prefeitura.
    const mensagensRaw = coletar(parsed, "MensagemRetorno");
    const mensagens = mensagensRaw.map((m: any) => ({
      codigo: txt(m?.Codigo),
      mensagem: txt(m?.Mensagem),
      correcao: txt(m?.Correcao),
    }));
    base.mensagens = mensagens;

    // NFS-e autorizada => existe um nó Nfse/InfNfse com Numero e CodigoVerificacao.
    const infNfse = coletar(parsed, "InfNfse")[0] || coletar(parsed, "Nfse")[0];
    const numeroNfse = txt(infNfse?.Numero) || coletar(parsed, "Numero").map(txt).filter(Boolean)[0];
    const codVerif =
      txt(infNfse?.CodigoVerificacao) ||
      coletar(parsed, "CodigoVerificacao").map(txt).filter(Boolean)[0];
    const fault = coletar(parsed, "faultstring").map(txt).filter(Boolean)[0];

    if ((infNfse && numeroNfse) || codVerif) {
      // Autorizada: usa o número e código reais da prefeitura.
      base.autorizada = true;
      if (numeroNfse) base.numero = numeroNfse;
      if (codVerif) base.codigo_verificacao = codVerif;
    } else {
      // Rejeitada ou falha: monta um aviso com as mensagens de erro.
      base.autorizada = false;
      const erros = mensagens
        .map((m) => [m.codigo, m.mensagem, m.correcao].filter(Boolean).join(" — "))
        .filter(Boolean);
      const detalhe = erros.length
        ? erros.join(" | ")
        : fault || "A prefeitura não retornou a NFS-e. Verifique o retorno do webservice.";
      base.aviso = [avisoMunicipio, `Rejeitada pela prefeitura: ${detalhe}`]
        .filter(Boolean)
        .join(" ");
    }

    return base;
  }
}

export default new NfseService();
