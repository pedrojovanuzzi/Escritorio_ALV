import iconv from "iconv-lite";

export interface ClienteImportado {
  codigo: string;
  nome: string;
  endereco: string;
  cidade: string;
  uf: string;
  cep: string;
}

export interface ResultadoImport {
  clientes: ClienteImportado[];
  total_declarado: number | null; // "Clientes cadastrados: NNN"
  total_lido: number;
  encoding: string;
  avisos: string[];
}

/**
 * Decodifica o buffer escolhendo o encoding mais provável.
 * Relatórios de sistemas DOS/terminal costumam ser CP850; também tenta latin1 e utf8.
 */
function decodificar(buffer: Buffer): { texto: string; encoding: string } {
  const candidatos: Array<"utf8" | "cp850" | "latin1"> = ["utf8", "cp850", "latin1"];
  let melhor = { texto: "", encoding: "latin1", score: -Infinity };

  for (const enc of candidatos) {
    let texto: string;
    try {
      texto = iconv.decode(buffer, enc);
    } catch {
      continue;
    }
    // Pontua: penaliza caractere de substituição (�) e controles estranhos;
    // bonifica letras acentuadas portuguesas válidas.
    let score = 0;
    for (const ch of texto) {
      const code = ch.charCodeAt(0);
      if (code === 0xfffd) score -= 5; // replacement char
      else if ("áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ".includes(ch)) score += 2;
      else if (code < 9 || (code > 13 && code < 32)) score -= 3; // controles
    }
    if (score > melhor.score) melhor = { texto, encoding: enc, score };
  }
  return { texto: melhor.texto, encoding: melhor.encoding };
}

const semAcento = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Acha a posição (coluna) de um rótulo no cabeçalho, ignorando acentos/caixa. */
function posCabecalho(header: string, rotulo: string): number {
  return semAcento(header).indexOf(rotulo);
}

const ehSeparador = (l: string) => /^[\s\-_=|+.]*$/.test(l);
const ehCabecalho = (l: string) => {
  const s = semAcento(l);
  return s.includes("nome") && s.includes("cidade") && s.includes("estado");
};
const ehTitulo = (l: string) => {
  const s = semAcento(l);
  return s.includes("emissao") || s.includes("pagina") || s.includes("(reduzido)");
};

export function parseClientesTxt(buffer: Buffer): ResultadoImport {
  const { texto, encoding } = decodificar(buffer);
  // Remove form-feed (quebra de página) e divide em linhas.
  const linhas = texto.replace(/\f/g, "\n").split(/\r?\n/);
  const avisos: string[] = [];

  const idxHeader = linhas.findIndex(ehCabecalho);
  if (idxHeader === -1) {
    return {
      clientes: [],
      total_declarado: null,
      total_lido: 0,
      encoding,
      avisos: ["Cabeçalho (Nome / Cidade / Estado) não encontrado no arquivo."],
    };
  }

  const header = linhas[idxHeader];
  const posEnde = posCabecalho(header, "ende"); // Endereço
  const posCidade = posCabecalho(header, "cidade");
  const posEstado = posCabecalho(header, "estado");
  const posCep = posCabecalho(header, "cep");

  // Limites de cada coluna (fim aberto quando a próxima não existe).
  const fimNome = posEnde > 0 ? posEnde : posCidade;
  const fimEnde = posCidade > 0 ? posCidade : posEstado;
  const fimCidade = posEstado;
  const fimEstado = posCep > 0 ? posCep : posEstado + 8;

  const fatia = (linha: string, ini: number, fim: number) =>
    (fim > ini && fim <= linha.length + 200
      ? linha.substring(ini, fim < 0 ? undefined : fim)
      : linha.substring(ini)
    ).trim();

  const clientes: ClienteImportado[] = [];
  let totalDeclarado: number | null = null;

  for (let i = idxHeader + 1; i < linhas.length; i++) {
    const linha = linhas[i].replace(/\s+$/, "");
    if (!linha.trim()) continue;
    if (ehCabecalho(linha) || ehTitulo(linha) || ehSeparador(linha)) continue;

    const mTotal = semAcento(linha).match(/clientes cadastrados[:\s]*([0-9]+)/);
    if (mTotal) {
      totalDeclarado = parseInt(mTotal[1], 10);
      continue;
    }

    // Coluna 1 = código + nome (do início até o começo de Endereço/Cidade).
    const col1 = fatia(linha, 0, fimNome > 0 ? fimNome : 40);
    const mCod = col1.match(/^(\d+)\s+(.*)$/);
    const codigo = mCod ? mCod[1] : "";
    const nome = (mCod ? mCod[2] : col1).trim();
    if (!nome) continue;

    const endereco = posEnde >= 0 ? fatia(linha, posEnde, fimEnde) : "";
    const cidade = posCidade >= 0 ? fatia(linha, posCidade, fimCidade) : "";
    const uf = posEstado >= 0 ? fatia(linha, posEstado, fimEstado).slice(0, 2) : "";
    const cep = posCep >= 0 ? fatia(linha, posCep, linha.length) : "";

    clientes.push({ codigo, nome, endereco, cidade, uf, cep });
  }

  if (totalDeclarado !== null && totalDeclarado !== clientes.length) {
    avisos.push(
      `O arquivo declara ${totalDeclarado} cliente(s), mas ${clientes.length} foram lidos. Confira o arquivo.`
    );
  }

  return {
    clientes,
    total_declarado: totalDeclarado,
    total_lido: clientes.length,
    encoding,
    avisos,
  };
}
