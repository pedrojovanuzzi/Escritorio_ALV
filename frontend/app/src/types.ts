export type TipoPessoa = "PF" | "PJ";

export interface UserData {
  id: number;
  nome: string;
  email: string;
  cargo: string;
  token: string;
}

export interface Usuario {
  id?: number;
  nome: string;
  email: string;
  cargo?: string;
  password?: string;
  criado_em?: string;
}

export interface Cliente {
  id?: number;
  codigo_externo?: string;
  nome: string;
  nome_fantasia?: string;
  doc: string;
  tipo: TipoPessoa;
  telefone?: string;
  email?: string;
  inscricao_municipal?: string;
  inscricao_estadual?: string;
  cnae?: string;
  contador?: string;
  responsavel_legal?: string;
  natureza_juridica?: string;
  capital_social?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
}

export type TipoDocumento = "NFSE" | "BOLETO";

export interface Documento {
  id?: number;
  tipo: TipoDocumento;
  numero?: string;
  cliente_id?: number;
  cliente_nome?: string;
  valor: number;
  status?: string;
  codigo_verificacao?: string;
  linha_digitavel?: string;
  dados?: any;
  criado_em?: string;
}

export interface ConfigNfse {
  ambiente: "homologacao" | "producao";
  item_lista: string;
  cnae: string;
  cod_tributacao_municipio: string;
  aliquota: string;
  discriminacao: string;
  regime: string;
  optante_simples: boolean;
  iss_retido: boolean;
  ws_username: string;
  ws_password: string;
  proximo_rps: number;
}

export interface ConfigBoleto {
  banco: string;
  carteira: string;
  especie: string;
  multa: string;
  juros: string;
  desconto: string;
  dias_vencimento: number;
  instrucoes: string;
}

export interface ConfigEmpresa {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  inscricao_municipal: string;
  inscricao_estadual: string;
  codigo_municipio: string;
  cnae: string;
  regime: string;
  optante_simples: boolean;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  telefone: string;
  email: string;
  banco: string;
  agencia: string;
  conta: string;
}

export interface Configuracoes {
  empresa: ConfigEmpresa;
  nfse: ConfigNfse;
  boleto: ConfigBoleto;
  atualizado_em?: string;
}

export interface Estatisticas {
  nfse_emitidas: number;
  boletos_gerados: number;
  valor_faturado: number;
  em_aberto: number;
  em_aberto_qtd: number;
}
