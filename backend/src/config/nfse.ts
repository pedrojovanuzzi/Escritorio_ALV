import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export type Ambiente = "homologacao" | "producao";

/** Pasta onde o certificado A1 (.pfx) enviado fica salvo. */
export const CERT_DIR = path.resolve(__dirname, "../files");

/** Caminho do certificado A1 utilizado na assinatura. */
export const CERT_PATH =
  process.env.NFSE_CERT_PATH || path.join(CERT_DIR, "certificado.pfx");

/** Senha do certificado A1 (definida no .env). */
export const CERT_PASSWORD = process.env.NFSE_CERT_PASSWORD || "";

/** Diretório temporário para reembalar o certificado durante o envio. */
export const TEMP_DIR = CERT_DIR;

/**
 * Endpoints (WSDL) por ambiente. Os valores padrão seguem o provedor Fiorilli
 * usado pela prefeitura. Ajuste no .env para o webservice correto do seu município.
 */
export function getWsdlUrl(ambiente: Ambiente): string {
  if (ambiente === "homologacao") {
    return (
      process.env.NFSE_WSDL_HOMOLOGACAO ||
      "http://fi1.fiorilli.com.br:5663/IssWeb-ejb/IssWebWS/IssWebWS?wsdl"
    );
  }
  return (
    process.env.NFSE_WSDL_PRODUCAO ||
    "https://wsnfe.arealva.sp.gov.br:8443/IssWeb-ejb/IssWebWS/IssWebWS?wsdl"
  );
}

/** Dados do prestador (o escritório/empresa emitente). */
export const PRESTADOR = {
  cnpj: (process.env.NFSE_PRESTADOR_CNPJ || "20843290000142").replace(/\D/g, ""),
  inscricaoMunicipal: process.env.NFSE_PRESTADOR_IM || "21950014",
  codigoMunicipio: process.env.NFSE_CODIGO_MUNICIPIO || "3506003", // 3506003 = Bauru/SP
  cnae: process.env.NFSE_CNAE || "6209100",
};

/** Credenciais de acesso ao webservice (quando exigidas). */
export const WS_CREDENCIAIS = {
  username: process.env.NFSE_WS_USERNAME || "",
  password: process.env.NFSE_WS_PASSWORD || "",
};

/**
 * Dados padrão da empresa emitente (prestador). Usados quando ainda não há
 * configuração salva no banco (tela Configurações → Empresa emitente).
 * Os valores vêm do .env para manter o comportamento atual.
 */
export const EMPRESA_PADRAO = {
  razao_social: process.env.NFSE_PRESTADOR_RAZAO || "Escritório Alvorada Contabilidade",
  nome_fantasia: process.env.NFSE_PRESTADOR_FANTASIA || "Alvorada Contabilidade",
  cnpj: PRESTADOR.cnpj,
  inscricao_municipal: PRESTADOR.inscricaoMunicipal,
  inscricao_estadual: "",
  codigo_municipio: PRESTADOR.codigoMunicipio,
  cnae: PRESTADOR.cnae,
  regime: "Simples Nacional",
  optante_simples: true,
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  municipio: "Bauru",
  uf: "SP",
  cep: "",
  telefone: "",
  email: "",
  // Dados bancários do beneficiário (boleto)
  banco: "",
  agencia: "",
  conta: "",
};

export type EmpresaConfig = typeof EMPRESA_PADRAO;
