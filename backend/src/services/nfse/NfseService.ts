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
import { getEmpresa, getNfseConfig, setProximoRps } from "../configuracao/EmpresaConfig";
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
  numero: string; // número da NFS-e (atribuído pela prefeitura quando autorizada)
  numero_rps: string; // número do RPS (sequência controlada por nós)
  serie_rps: string;
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

    const uuidLanc = uuidv4().replace(/-/g, "").slice(0, 20);
    const t = dados.tomador;

    // Empresa emitente (prestador) — configurável em Configurações → Empresa.
    const empresa = await getEmpresa();
    const nfseCfg = await getNfseConfig();
    // Optante do Simples Nacional: determinado pelo "Regime de tributação" em
    // Configurações → NFS-e (Simples Nacional => optante; Lucro Presumido/Real =>
    // não optante). A emissão pode sobrepor via dados.optanteSimples. Precisa
    // bater com o cadastro do contribuinte na prefeitura (erro L124 quando diverge).
    const ehSimples = /simples/i.test(String(nfseCfg.regime || ""));
    const optanteSimples =
      dados.optanteSimples !== undefined ? !!dados.optanteSimples : ehSimples;
    // Número do RPS: persistente (config). Pode vir explícito na emissão; senão usa
    // o "proximo_rps" salvo. Só avança quando a NFS-e é autorizada (ver no fim),
    // permitindo reenviar o mesmo número se a prefeitura rejeitar.
    const numeroRps = dados.numeroRps ?? (Number(nfseCfg.proximo_rps) || 1);
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
      // CNAE: respeita o valor enviado na emissão (inclusive vazio, para OMITIR a
      // tag — útil quando a prefeitura não exige/valida CNAE, ex. erro L115). Sem
      // valor na emissão (ex. lote), usa o da config da empresa.
      cnae: dados.cnae !== undefined ? soDig(dados.cnae) : soDig(empresa.cnae),
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
      // 1 = Tomador. Só é enviado quando há retenção (ver NfseXmlFactory); enviar
      // 2 (Intermediário) sem dados do intermediário dispara o erro L107.
      responsavelRetencao: 1,
      // O XSD da prefeitura (tsItemListaServico) aceita no máx. 6 chars no formato
      // "GG.SS" da LC 116. Valores como "14.02.01" (código de tributação completo)
      // são reduzidos ao item da lista ("14.02") para não estourar o maxLength.
      itemListaServico: (dados.item_lista || "14.02")
        .toString()
        .split(".")
        .slice(0, 2)
        .join("."),
      // Código de tributação do município (opcional): usa o da emissão; senão o
      // da config de NFS-e. Vazio => tag omitida.
      codigoTributacaoMunicipio: (
        dados.cod_tributacao_municipio !== undefined
          ? dados.cod_tributacao_municipio
          : nfseCfg.cod_tributacao_municipio || ""
      )
        .toString()
        .trim(),
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
      // Regime Especial de Tributação: obrigatório p/ optante do Simples Nacional.
      // 6 = ME/EPP, 5 = MEI. Quando NÃO optante, vai vazio (tag omitida).
      regimeEspecial: optanteSimples ? "6" : "",
      optanteSimples: optanteSimples ? 1 : 2,
      incentivoFiscal: 2,
    };

    const rpsXml = this.xmlFactory.createRpsXml(dadosRps);

    const base: ResultadoNfse = {
      ambiente,
      // numero = NFS-e (preenchido pela prefeitura ao autorizar). Até lá, espelha
      // o RPS. numero_rps preserva sempre o RPS, independente da autorização.
      numero: String(numeroRps),
      numero_rps: String(numeroRps),
      serie_rps: dados.serieRps || "1",
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

    // Envia SEM assinatura XML. Todas as posições/namespaces de <Signature>
    // (RPS, Lote, xmldsig, abrasf, com/sem prefixo) foram recusadas com
    // "Signature unexpected / no child element expected" — sinal de que o schema
    // deste provedor Fiorilli NÃO possui elemento Signature (autenticação por
    // login + certificado no TLS, equivalente ao "NaoAssinar" do ACBr).
    const provider = new FiorilliProvider(CERT_PATH, TEMP_DIR, getWsdlUrl(ambiente));

    const loteXml = this.xmlFactory.createLoteXml(`LOTE${uuidLanc}`, 1, rpsXml, prestador);
    const envioXml = this.xmlFactory.createEnviarLoteEnvio(loteXml);
    base.xmlAssinado = envioXml;

    // Credenciais do webservice: prioriza o que estiver salvo em Configurações →
    // NFS-e (login do contribuinte no provedor); cai no .env como fallback.
    const wsUser = (nfseCfg.ws_username || "").trim() || WS_CREDENCIAIS.username;
    const wsPass = (nfseCfg.ws_password || "").trim() || WS_CREDENCIAIS.password;

    const soap = this.xmlFactory.createEnviarLoteSoap(envioXml, wsUser, wsPass);

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

    // Loga o retorno cru no console do backend para diagnóstico de faults/erros.
    console.log("[NFSe] retorno do webservice:", String(retorno).slice(0, 2000));

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
      // Avança o contador de RPS só quando autorizada (rejeições reusam o número).
      if (dados.numeroRps === undefined) await setProximoRps(numeroRps + 1);
    } else {
      // Rejeitada ou falha: monta um aviso com as mensagens de erro.
      base.autorizada = false;
      const erros = mensagens
        .map((m) => [m.codigo, m.mensagem, m.correcao].filter(Boolean).join(" — "))
        .filter(Boolean);
      // Sem erro estruturado: usa o fault SOAP ou um trecho cru do retorno.
      const trechoCru =
        typeof retorno === "string" && retorno.trim()
          ? retorno.replace(/\s+/g, " ").trim().slice(0, 600)
          : "";
      const detalhe = erros.length
        ? erros.join(" | ")
        : fault ||
          trechoCru ||
          "A prefeitura não retornou a NFS-e. Verifique o retorno do webservice.";
      base.aviso = [avisoMunicipio, `Rejeitada pela prefeitura: ${detalhe}`]
        .filter(Boolean)
        .join(" ");
    }

    return base;
  }

  /**
   * Consulta as NFS-e emitidas pelo prestador na prefeitura e ajusta o
   * "proximo_rps" para (maior RPS encontrado + 1). Usa o campo IdentificacaoRps
   * (o RPS), não o número da NFS-e.
   */
  async sincronizarRps(
    certPassword?: string,
    numeroNfseFinal?: number
  ): Promise<{ maior_rps: number; proximo_rps: number; encontradas: number; aviso?: string }> {
    const empresa = await getEmpresa();
    const nfseCfg = await getNfseConfig();

    // A consulta por faixa exige um NumeroNfseFinal existente. Sem ele não há
    // como descobrir as NFS-e (a consulta por período do provedor retorna erro).
    if (!numeroNfseFinal || numeroNfseFinal <= 0) {
      return {
        maior_rps: 0,
        proximo_rps: Number(nfseCfg.proximo_rps) || 1,
        encontradas: 0,
        aviso:
          "Informe o número da última NFS-e emitida (consulte no portal da prefeitura) para buscar o RPS.",
      };
    }
    const ambiente: Ambiente = nfseCfg.ambiente === "producao" ? "producao" : "homologacao";
    const soDig = (s: any) => String(s ?? "").replace(/\D/g, "");
    const prestador = {
      cnpj: soDig(empresa.cnpj) || PRESTADOR.cnpj,
      inscricaoMunicipal: empresa.inscricao_municipal || PRESTADOR.inscricaoMunicipal,
      cnae: "",
    };
    const wsUser = (nfseCfg.ws_username || "").trim() || WS_CREDENCIAIS.username;
    const wsPass = (nfseCfg.ws_password || "").trim() || WS_CREDENCIAIS.password;
    const senha = certPassword || CERT_PASSWORD;

    const provider = new FiorilliProvider(CERT_PATH, TEMP_DIR, getWsdlUrl(ambiente));

    let maior = 0;
    let encontradas = 0;
    let avisoConsulta = "";

    for (let pagina = 1; pagina <= 200; pagina++) {
      const envio = this.xmlFactory.createConsultarFaixaEnvio(prestador, 1, numeroNfseFinal, pagina);
      const soap = this.xmlFactory.createConsultarFaixaSoap(envio, wsUser, wsPass);
      const retorno = await provider.sendSoapRequest(soap, "consultarNfsePorFaixa", senha);

      if (pagina === 1) {
        console.log("[NFSe] consulta por faixa - retorno:", String(retorno).slice(0, 2000));
      }

      let parsed: any = retorno;
      try {
        parsed = await parseStringPromise(retorno, {
          explicitArray: false,
          tagNameProcessors: [processors.stripPrefix],
        });
      } catch {
        /* mantém cru */
      }

      const rpsNums = coletar(parsed, "IdentificacaoRps")
        .map((r: any) => parseInt(txt(r?.Numero), 10))
        .filter((n: number) => !isNaN(n));

      if (rpsNums.length === 0) {
        // Sem resultados: registra eventual fault/mensagem só na 1ª página.
        if (pagina === 1) {
          const fault = coletar(parsed, "faultstring").map(txt).filter(Boolean)[0];
          const msg = coletar(parsed, "Mensagem").map(txt).filter(Boolean)[0];
          avisoConsulta = fault || msg || "";
        }
        break;
      }

      encontradas += rpsNums.length;
      maior = Math.max(maior, ...rpsNums);
    }

    const proximoAtual = Number(nfseCfg.proximo_rps) || 1;
    const proximo = maior > 0 ? maior + 1 : proximoAtual;
    if (maior > 0) await setProximoRps(proximo);

    return { maior_rps: maior, proximo_rps: proximo, encontradas, aviso: avisoConsulta || undefined };
  }
}

export default new NfseService();
