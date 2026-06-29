import React, { useEffect, useState } from "react";
import { FiX, FiLayers } from "react-icons/fi";
import api from "../api/api";
import { Cliente } from "../types";
import { PrimaryButton } from "./ui";
import { DadosNfseForm } from "./DadosNfseForm";

/**
 * Edição em massa dos dados de serviço/NFS-e: aplica os mesmos valores a vários
 * clientes de uma vez. Campos deixados em branco não alteram o cadastro.
 */
export function EditarNfseLoteModal({
  clientes,
  onFechar,
  onSalvo,
}: {
  clientes: Cliente[];
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const [dados, setDados] = useState<Partial<Cliente>>({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    setDados({});
    setErro("");
  }, [clientes]);

  if (clientes.length === 0) return null;

  async function salvar() {
    const patch: Record<string, string> = {};
    (["item_lista", "cnae", "aliquota", "regime", "cod_tributacao_municipio", "discriminacao"] as const).forEach(
      (campo) => {
        const v = String(dados[campo] ?? "").trim();
        if (v) patch[campo] = v;
      }
    );
    if (Object.keys(patch).length === 0) {
      setErro("Preencha ao menos um campo para aplicar.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      await api.put("/clientes/lote", { ids: clientes.map((c) => c.id), patch });
      onSalvo();
    } catch {
      setErro("Erro ao aplicar os dados aos clientes.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-[680px] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-[#EEF2F0]">
          <h3 className="font-sora text-lg font-bold m-0 flex items-center gap-2">
            <FiLayers size={18} className="text-brand" /> Editar dados de NFS-e em massa
          </h3>
          <button onClick={onFechar} className="text-[#9AA8A2] hover:text-ink">
            <FiX size={20} />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto scrl flex flex-col gap-4">
          <div className="text-[13px] text-[#5A6A63] bg-[#F2FBF8] border border-[#CFEDE5] rounded-[10px] px-3.5 py-3">
            Os valores preenchidos abaixo serão aplicados a{" "}
            <strong className="text-brand-dark">{clientes.length} cliente(s)</strong>. Campos
            deixados em branco <strong>não</strong> alteram o cadastro existente.
          </div>
          <DadosNfseForm
            valores={dados}
            onChange={(campo, v) => setDados((d) => ({ ...d, [campo]: v }))}
          />
          <div className="max-h-[120px] overflow-y-auto scrl text-[12.5px] text-[#7A8A84] border border-[#EEF2F0] rounded-[10px] p-3">
            {clientes.map((c) => c.nome).join(" · ")}
          </div>
          {erro && (
            <div className="text-[13px] text-[#C0392B] bg-[#FBE6E3] border border-[#f3c9c2] rounded-[10px] px-3 py-2">
              {erro}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 pt-4 border-t border-[#EEF2F0]">
          <button
            onClick={onFechar}
            className="h-11 px-5 rounded-xl border-[1.5px] border-[#E2E8E6] bg-white text-sm font-semibold text-[#34433D] hover:border-brand"
          >
            Cancelar
          </button>
          <PrimaryButton onClick={salvar} disabled={salvando} className="px-6">
            {salvando ? "Aplicando…" : `Aplicar a ${clientes.length} cliente(s)`}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
