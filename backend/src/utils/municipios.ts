import municipios from "../data/municipios-ibge.json";

// Mapa "UF:CIDADE_NORMALIZADA" -> código IBGE (7 dígitos). Gerado da base oficial do IBGE.
const tabela = municipios as Record<string, string>;

function norm(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .trim();
}

/**
 * Resolve o código IBGE do município a partir do nome da cidade + UF.
 * Retorna null quando não encontrado.
 */
export function codigoIbge(cidade?: string, uf?: string): string | null {
  if (!cidade || !uf) return null;
  // Cidade pode vir como "Bauru / SP" ou "Bauru" — remove a UF se grudada.
  const cidadeLimpa = cidade.replace(/[\/-]\s*[A-Za-z]{2}\s*$/, "").trim();
  const key = norm(uf) + ":" + norm(cidadeLimpa);
  return tabela[key] || null;
}
