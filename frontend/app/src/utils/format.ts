export function fmtBRL(n: number): string {
  return (
    "R$ " +
    Number(n || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function iniciais(nome: string): string {
  return (nome || "")
    .replace(/[^A-Za-zÀ-ÿ ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const CORES = ["#0FB99A", "#0A9E84", "#1FA8E0", "#E0A11F", "#8A5CF0", "#E05C7B"];
export function corPorIndice(i: number): string {
  return CORES[i % CORES.length];
}

// "R$ 1.234,56" | "1234,56" | 1234.56  ->  1234.56
export function parseValor(v: string | number): number {
  if (typeof v === "number") return v;
  const limpo = String(v)
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const n = parseFloat(limpo);
  return isNaN(n) ? 0 : n;
}
