/**
 * BoletoService — STUB do protótipo.
 *
 * Aqui ficará o registro real do boleto na API do banco (ex.: Banco do Brasil,
 * Bradesco, Itaú), com cálculo do nosso número, dígito verificador e linha
 * digitável. Por enquanto apenas gera uma linha digitável fictícia.
 */

export interface DadosBoleto {
  cliente_id?: number;
  cliente_nome?: string;
  valor: number;
  vencimento?: string;
  numero_documento?: string;
  banco?: string;
  multa?: number;
  juros?: number;
  instrucoes?: string;
  [key: string]: any;
}

export interface ResultadoBoleto {
  numero: string;
  nosso_numero: string;
  linha_digitavel: string;
  registrado_em: string;
}

let sequencial = 94812;

function fakeLinhaDigitavel(valor: number): string {
  const v = String(Math.round(valor * 100)).padStart(10, "0");
  return `00190.00009 04812.000063 00000.000189 4 9025${v}`;
}

class BoletoService {
  /** Simula o registro de um boleto. */
  async registrar(dados: DadosBoleto): Promise<ResultadoBoleto> {
    // TODO: substituir pela chamada real à API bancária.
    await new Promise((r) => setTimeout(r, 150));

    const numero = String(++sequencial).padStart(8, "0");
    return {
      numero,
      nosso_numero: `12000-${numero}-0`,
      linha_digitavel: fakeLinhaDigitavel(dados.valor),
      registrado_em: new Date().toISOString(),
    };
  }
}

export default new BoletoService();
