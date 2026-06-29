import React from "react";
import { Cliente } from "../types";
import { Field } from "./ui";

/**
 * Campos de serviço / NFS-e padrão de um cliente. Reutilizado no cadastro de
 * cliente, no popup de completar dados e na edição em massa.
 */
export function DadosNfseForm({
  valores,
  onChange,
}: {
  valores: Partial<Cliente>;
  onChange: (campo: keyof Cliente, valor: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Field label="Item lista serviço" value={valores.item_lista || ""} onChange={(v) => onChange("item_lista", v)} mono />
      <Field label="CNAE" value={valores.cnae || ""} onChange={(v) => onChange("cnae", v)} mono />
      <Field label="Alíquota ISS (%)" value={valores.aliquota || ""} onChange={(v) => onChange("aliquota", v)} mono />
      <div>
        <label className="block text-[12.5px] font-semibold text-[#5A6A63] mb-1.5">
          Regime de tributação
        </label>
        <select
          value={valores.regime || ""}
          onChange={(e) => onChange("regime", e.target.value)}
          className="w-full h-[42px] border-[1.5px] border-[#E2E8E6] rounded-[10px] px-3 text-[13.5px] bg-white outline-none focus:border-brand"
        >
          <option value="">—</option>
          <option>Simples Nacional — ME/EPP</option>
          <option>Lucro Presumido</option>
          <option>Lucro Real</option>
        </select>
      </div>
      <Field
        className="sm:col-span-2"
        label="Cód. tributação município (opcional)"
        value={valores.cod_tributacao_municipio || ""}
        onChange={(v) => onChange("cod_tributacao_municipio", v)}
        mono
      />
      <div className="sm:col-span-3">
        <label className="block text-[12.5px] font-semibold text-[#5A6A63] mb-1.5">
          Discriminação padrão do serviço
        </label>
        <textarea
          value={valores.discriminacao || ""}
          onChange={(e) => onChange("discriminacao", e.target.value)}
          placeholder="Texto sugerido para a discriminação do serviço"
          className="w-full h-[70px] border-[1.5px] border-[#E2E8E6] rounded-[10px] p-3 text-[13.5px] resize-y outline-none focus:border-brand leading-relaxed"
        />
      </div>
    </div>
  );
}
