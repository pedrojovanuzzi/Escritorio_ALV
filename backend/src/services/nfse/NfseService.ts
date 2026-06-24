import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { parseStringPromise } from "xml2js";
import {
  Ambiente,
  CERT_PATH,
  CERT_PASSWORD,
  TEMP_DIR,
  getWsdlUrl,
  PRESTADOR,
  WS_CREDENCIAIS,
} from "../../config/nfse";
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
  retornoWebservice?: any; // resposta crua/parseada do webservice
  aviso?: string; // mensagem quando o envio não pôde ser feito
}

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
    // O XML exige código IBGE do município; se vier nome de cidade, usa o do prestador.
    const tomadorCodMun = /^\d+$/.test(t.municipio || "")
      ? (t.municipio as string)
      : PRESTADOR.codigoMunicipio;

    const dadosRps: DadosRps = {
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
      codigoMunicipio: PRESTADOR.codigoMunicipio,
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
    };

    const senha = dados.certPassword || CERT_PASSWORD;

    // Sem certificado ou sem senha: devolve o RPS montado, pronto para envio.
    if (!this.certificadoConfigurado() || !senha) {
      base.aviso = !this.certificadoConfigurado()
        ? "Certificado A1 não encontrado. Faça o upload em /api/nfse/certificado para transmitir ao webservice."
        : "Senha do certificado não configurada (NFSE_CERT_PASSWORD). RPS montado, mas não transmitido.";
      return base;
    }

    // Assina e envia.
    const provider = new FiorilliProvider(CERT_PATH, TEMP_DIR, getWsdlUrl(ambiente));
    const xmlAssinado = provider.assinarXml(rpsXml, `RPS${uuidLanc}`, senha);
    base.xmlAssinado = xmlAssinado;

    const loteXml = this.xmlFactory.createLoteXml(`LOTE${uuidLanc}`, 1, xmlAssinado);
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
      parsed = await parseStringPromise(retorno, { explicitArray: false });
    } catch {
      /* mantém retorno cru se não for XML */
    }

    base.enviado = true;
    base.retornoWebservice = parsed;
    return base;
  }
}

export default new NfseService();
