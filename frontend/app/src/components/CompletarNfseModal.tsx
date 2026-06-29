import React, { useEffect, useState } from "react";
import { FiX, FiAlertTriangle } from "react-icons/fi";
import api from "../api/api";
import { Cliente } from "../types";
import { PrimaryButton } from "./ui";
import { DadosNfseForm } from "./DadosNfseForm";
import { camposNfseFaltantes } from "../utils/nfse";

/**
 * Popup que obriga a completar os dados de NFS-e do cadastro do cliente antes
 * de emitir. Salva direto no cadastro (PUT /clientes/:id).
 */
export function CompletarNfseModal({
  cliente,
  onFechar,
  onSalvo,
}: {
  cliente: Cliente | null;
  onFechar: () => void;
  onSalvo: (c: Cliente) => void;
}) {
  const [dados, setDados] = useState<Partial<Cliente>>({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (cliente) {
      setDados({
        item_lista: cliente.item_lista || "",
        cnae: cliente.cnae || "",
        aliquota: cliente.aliquota || "",
        regime: cliente.regime || "",
        cod_tributacao_municipio: cliente.cod_tributacao_municipio || "",
        discriminacao: cliente.discriminacao || "",
      });
      setErro("");
    }
  }, [cliente]);

  if (!cliente) return null;

  const faltando = camposNfseFaltantes(dados);

  async function salvar() {
    if (faltando.length) {
      setErro(`Preencha: ${faltando.join(", ")}.`);
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      const { data } = await api.put(`/clientes/${cliente!.id}`, { ...cliente, ...dados });
      onSalvo(data);
    } catch {
      setErro("Erro ao salvar os dados do cliente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl w-full max-w-[680px] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-[#EEF2F0]">
          <h3 className="font-sora text-lg font-bold m-0">Completar dados de NFS-e</h3>
          <button onClick={onFechar} className="text-[#9AA8A2] hover:text-ink">
            <FiX size={20} />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto scrl flex flex-col gap-4">
          <div className="flex items-start gap-2.5 text-[13px] text-[#8A6D1E] bg-[#FBF2DC] border border-[#F0E0B0] rounded-[10px] px-3.5 py-3">
            <FiAlertTriangle size={18} className="flex-none mt-0.5" />
            <div>
              O cliente <strong>{cliente.nome}</strong> precisa destes dados no cadastro para
              emitir NFS-e. Eles ficam salvos no cliente e serão usados nas próximas emissões.
            </div>
          </div>
          <DadosNfseForm
            valores={dados}
            onChange={(campo, v) => setDados((d) => ({ ...d, [campo]: v }))}
          />
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
            {salvando ? "Salvando…" : "Salvar e continuar"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
