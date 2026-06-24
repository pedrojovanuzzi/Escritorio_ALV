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
  nome: string;
  doc: string;
  tipo: TipoPessoa;
  email?: string;
  inscricao_municipal?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  municipio?: string;
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

export interface Estatisticas {
  nfse_emitidas: number;
  boletos_gerados: number;
  valor_faturado: number;
  em_aberto: number;
  em_aberto_qtd: number;
}
