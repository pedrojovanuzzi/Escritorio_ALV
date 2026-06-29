import { Cliente } from "../types";

/** Campos do cadastro do cliente obrigatórios para emitir NFS-e. */
export const CAMPOS_NFSE: Array<{ campo: keyof Cliente; label: string }> = [
  { campo: "item_lista", label: "Item lista serviço" },
  { campo: "cnae", label: "CNAE" },
  { campo: "aliquota", label: "Alíquota ISS (%)" },
  { campo: "regime", label: "Regime de tributação" },
  { campo: "discriminacao", label: "Discriminação do serviço" },
];

/** Rótulos dos campos de NFS-e ainda não preenchidos no cliente. */
export function camposNfseFaltantes(c?: Partial<Cliente> | null): string[] {
  if (!c) return CAMPOS_NFSE.map((f) => f.label);
  return CAMPOS_NFSE.filter(
    (f) => !String((c as any)[f.campo] ?? "").trim()
  ).map((f) => f.label);
}

/** True quando o cliente tem todos os dados de NFS-e preenchidos. */
export function nfseCompleto(c?: Partial<Cliente> | null): boolean {
  return camposNfseFaltantes(c).length === 0;
}
