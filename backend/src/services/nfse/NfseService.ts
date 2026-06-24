/**
 * NfseService — STUB do protótipo.
 *
 * Aqui ficará a integração real com o webservice da prefeitura (padrão ABRASF),
 * assinatura com certificado A1 (node-forge / xml-crypto), envio do lote RPS e
 * leitura do retorno. Por enquanto apenas simula a autorização e devolve um
 * número de NFS-e + código de verificação.
 */

export interface DadosNfse {
  cliente_id?: number;
  cliente_nome?: string;
  valor: number;
  aliquota?: number;
  discriminacao?: string;
  item_lista?: string;
  cnae?: string;
  competencia?: string;
  [key: string]: any;
}

export interface ResultadoNfse {
  numero: string;
  codigo_verificacao: string;
  valor_iss: number;
  valor_liquido: number;
  emitida_em: string;
}

function gerarCodigoVerificacao(): string {
  return Math.random().toString(36).slice(2, 11).toUpperCase();
}

let sequencial = 4903;

class NfseService {
  /** Simula a emissão de uma NFS-e. */
  async emitir(dados: DadosNfse): Promise<ResultadoNfse> {
    const aliquota = dados.aliquota ?? 5;
    const valorIss = +(dados.valor * (aliquota / 100)).toFixed(2);

    // TODO: substituir pela chamada SOAP real à prefeitura.
    await new Promise((r) => setTimeout(r, 150));

    return {
      numero: String(++sequencial),
      codigo_verificacao: gerarCodigoVerificacao(),
      valor_iss: valorIss,
      valor_liquido: +dados.valor.toFixed(2),
      emitida_em: new Date().toISOString(),
    };
  }
}

export default new NfseService();
