import iconv from "iconv-lite";

export interface ClienteImportado {
  codigo: string;
  nome: string;
  fantasia: string;
  doc: string;
  telefone: string;
  endereco: string;
  cidade: string;
  uf: string;
  cep: string;
}

export interface ResultadoImport {
  clientes: ClienteImportado[];
  total_declarado: number | null;
  total_lido: number;
  encoding: string;
  formato: "tab" | "colunas";
  avisos: string[];
}

/* ----------------------------- utilidades ----------------------------- */

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
    let score = 0;
    for (const ch of texto) {
      const code = ch.charCodeAt(0);
      if (code === 0xfffd) score -= 5;
      else if ("áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ".includes(ch)) score += 2;
      else if (code < 9 || (code > 13 && code < 32)) score -= 3;
    }
    if (score > melhor.score) melhor = { texto, encoding: enc, score };
  }
  return { texto: melhor.texto, encoding: melhor.encoding };
}

const semAcento = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const UFS = new Set([
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
]);
const UF_POR_NOME: Record<string, string> = {
  ACRE: "AC", ALAGOAS: "AL", AMAPA: "AP", AMAZONAS: "AM", BAHIA: "BA",
  CEARA: "CE", "DISTRITO FEDERAL": "DF", "ESPIRITO SANTO": "ES", GOIAS: "GO",
  MARANHAO: "MA", "MATO GROSSO": "MT", "MATO GROSSO DO SUL": "MS",
  "MINAS GERAIS": "MG", PARA: "PA", PARAIBA: "PB", PARANA: "PR",
  PERNAMBUCO: "PE", PIAUI: "PI", "RIO DE JANEIRO": "RJ",
  "RIO GRANDE DO NORTE": "RN", "RIO GRANDE DO SUL": "RS", RONDONIA: "RO",
  RORAIMA: "RR", "SANTA CATARINA": "SC", "SAO PAULO": "SP", SERGIPE: "SE",
  TOCANTINS: "TO",
};

function normUF(s: string): string {
  const u = semAcento(s).toUpperCase().trim();
  if (u.length === 2 && UFS.has(u)) return u;
  return UF_POR_NOME[u] || "";
}

function ehDoc(s: string): string {
  const d = s.replace(/\D/g, "");
  return d.length === 11 || d.length === 14 ? d : "";
}

// Telefone EXIGE um separador (espaço/traço/parênteses) entre o DDD e o número.
// Assim um CPF contíguo de 11 dígitos não é confundido com celular.
function ehTelefone(s: string): boolean {
  const t = s.trim();
  return /^\(?\d{2}\)?[\s-]\d{4,5}-?\d{4}$/.test(t) || /^\d{2}\s\d{7,9}$/.test(t);
}

const ehData = (s: string) => /\d{2}\/\d{2}\/\d{4}/.test(s);

/* --------------------------- formato por TAB --------------------------- */

function parseTab(linhas: string[], encoding: string): ResultadoImport {
  const clientes: ClienteImportado[] = [];
  const avisos: string[] = [];

  for (const linha of linhas) {
    const f = linha.split("\t").map((x) => x.trim());
    if (f.length < 3) continue;
    // pula linha de cabeçalho (sem código numérico e com rótulos)
    if (!/^\d+$/.test(f[0]) && /nome|raz|cnpj|cpf|cidade/i.test(linha)) continue;

    // Estado: primeiro campo que seja UF/nome de estado.
    let estadoIdx = -1;
    let uf = "";
    for (let i = 0; i < f.length; i++) {
      const u = normUF(f[i]);
      if (u) {
        estadoIdx = i;
        uf = u;
        break;
      }
    }
    // Telefone: primeiro campo formatado como telefone.
    let telefone = "";
    for (const x of f) {
      if (ehTelefone(x)) {
        telefone = x;
        break;
      }
    }
    // CNPJ/CPF: primeiro documento válido que NÃO seja telefone.
    let doc = "";
    for (const x of f) {
      if (ehTelefone(x)) continue;
      const d = ehDoc(x);
      if (d) {
        doc = d;
        break;
      }
    }
    // Cidade: campo imediatamente antes do estado.
    const cidade = estadoIdx > 0 ? f[estadoIdx - 1] : "";

    // Código: primeiro campo, se numérico.
    const codigo = /^\d+$/.test(f[0]) ? f[0] : "";

    // Texto "real" = alfabético, len > 2, não UF/data/doc/telefone.
    const ehTexto = (x: string) =>
      !!x &&
      x.length > 2 &&
      /[A-Za-zÀ-ÿ]/.test(x) &&
      !normUF(x) &&
      !ehData(x) &&
      !ehDoc(x) &&
      !ehTelefone(x);

    // Nome (razão) e fantasia por posição (col 3 e 4); fallback heurístico.
    let nome = ehTexto(f[2]) ? f[2] : "";
    let fantasia = ehTexto(f[3]) && f[3] !== nome && f[3] !== cidade ? f[3] : "";
    if (!nome) {
      const cand = f.filter(
        (x, i) => i !== estadoIdx && i !== estadoIdx - 1 && ehTexto(x)
      );
      nome = cand[0] || "";
    }

    if (!nome) continue;
    clientes.push({
      codigo,
      nome,
      fantasia,
      doc,
      telefone,
      endereco: "",
      cidade,
      uf,
      cep: "",
    });
  }

  if (clientes.length === 0)
    avisos.push("Nenhum cliente reconhecido no arquivo (formato por tabulação).");

  return {
    clientes,
    total_declarado: null,
    total_lido: clientes.length,
    encoding,
    formato: "tab",
    avisos,
  };
}

/* ------------------------ formato colunas fixas ------------------------ */

const ehSeparador = (l: string) => /^[\s\-_=|+.]*$/.test(l);
const ehCabecalho = (l: string) => {
  const s = semAcento(l);
  return s.includes("nome") && s.includes("cidade") && s.includes("estado");
};
const ehTitulo = (l: string) => {
  const s = semAcento(l);
  return s.includes("emissao") || s.includes("pagina") || s.includes("(reduzido)");
};
const posCab = (header: string, rotulo: string) => semAcento(header).indexOf(rotulo);

function parseColunas(linhas: string[], encoding: string): ResultadoImport {
  const avisos: string[] = [];
  const idxHeader = linhas.findIndex(ehCabecalho);
  if (idxHeader === -1) {
    return {
      clientes: [],
      total_declarado: null,
      total_lido: 0,
      encoding,
      formato: "colunas",
      avisos: ["Cabeçalho (Nome / Cidade / Estado) não encontrado no arquivo."],
    };
  }

  const header = linhas[idxHeader];
  const posEnde = posCab(header, "ende");
  const posCidade = posCab(header, "cidade");
  const posEstado = posCab(header, "estado");
  const posCep = posCab(header, "cep");

  const fimNome = posEnde > 0 ? posEnde : posCidade;
  const fimEnde = posCidade > 0 ? posCidade : posEstado;
  const fimEstado = posCep > 0 ? posCep : posEstado + 8;

  const fatia = (l: string, ini: number, fim: number) =>
    (fim > ini ? l.substring(ini, fim) : l.substring(ini)).trim();

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

    const col1 = fatia(linha, 0, fimNome > 0 ? fimNome : 40);
    const mCod = col1.match(/^(\d+)\s+(.*)$/);
    const codigo = mCod ? mCod[1] : "";
    const nome = (mCod ? mCod[2] : col1).trim();
    if (!nome) continue;

    clientes.push({
      codigo,
      nome,
      fantasia: "",
      doc: "",
      telefone: "",
      endereco: posEnde >= 0 ? fatia(linha, posEnde, fimEnde) : "",
      cidade: posCidade >= 0 ? fatia(linha, posCidade, posEstado) : "",
      uf: posEstado >= 0 ? fatia(linha, posEstado, fimEstado).slice(0, 2) : "",
      cep: posCep >= 0 ? fatia(linha, posCep, linha.length) : "",
    });
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
    formato: "colunas",
    avisos,
  };
}

/* ------------------------------- entrada ------------------------------- */

export function parseClientesTxt(buffer: Buffer): ResultadoImport {
  const { texto, encoding } = decodificar(buffer);
  const linhas = texto.replace(/\f/g, "\n").split(/\r?\n/);
  const naoVazias = linhas.filter((l) => l.trim());
  const comTab = naoVazias.filter((l) => l.includes("\t")).length;

  // Maioria das linhas com TAB => formato separado por tabulação.
  if (naoVazias.length > 0 && comTab / naoVazias.length >= 0.5) {
    return parseTab(naoVazias, encoding);
  }
  return parseColunas(linhas, encoding);
}
