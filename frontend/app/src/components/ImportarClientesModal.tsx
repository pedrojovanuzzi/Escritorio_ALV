import React, { useRef, useState } from "react";
import { FiX, FiUploadCloud, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import api from "../api/api";
import { PrimaryButton } from "./ui";

interface Alteracao {
  campo: string;
  de: string;
  para: string;
}
interface ClienteLido {
  codigo: string;
  nome: string;
  fantasia: string;
  doc: string;
  telefone: string;
  endereco: string;
  cidade: string;
  uf: string;
  cep: string;
  numero?: string;
  bairro?: string;
  complemento?: string;
  email?: string;
  inscricao_municipal?: string;
  status?: "novo" | "alterado" | "igual";
  alteracoes?: Alteracao[];
}
interface Preview {
  clientes: ClienteLido[];
  total_declarado: number | null;
  total_lido: number;
  encoding: string;
  formato: "tab" | "colunas";
  avisos: string[];
  resumo?: { novos: number; alterados: number; iguais: number };
}

const ROTULO_CAMPO: Record<string, string> = {
  nome: "Nome",
  nome_fantasia: "Fantasia",
  doc: "CNPJ/CPF",
  telefone: "Telefone",
  email: "E-mail",
  inscricao_municipal: "Insc. municipal",
  inscricao_estadual: "Insc. estadual",
  cnae: "CNAE",
  contador: "Contador",
  responsavel_legal: "Responsável legal",
  natureza_juridica: "Natureza jurídica",
  capital_social: "Capital social",
  endereco: "Endereço",
  numero: "Número",
  complemento: "Complemento",
  bairro: "Bairro",
  municipio: "Cidade",
  uf: "UF",
  cep: "CEP",
};

function StatusTag({ status }: { status?: string }) {
  const map: Record<string, { bg: string; cor: string; txt: string }> = {
    novo: { bg: "#E6F7F3", cor: "#0A9E84", txt: "Novo" },
    alterado: { bg: "#FBF2DC", cor: "#C98A0E", txt: "Alterado" },
    igual: { bg: "#EEF1F0", cor: "#7A8A84", txt: "Igual" },
  };
  const c = map[status || "igual"];
  return (
    <span
      className="text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap"
      style={{ background: c.bg, color: c.cor }}
    >
      {c.txt}
    </span>
  );
}

export function ImportarClientesModal({
  aberto,
  onFechar,
  onImportado,
}: {
  aberto: boolean;
  onFechar: () => void;
  onImportado: () => void;
}) {
  const [arquivo, setArquivo] = useState<string>("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [erro, setErro] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setArquivo("");
    setPreview(null);
    setErro("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function fechar() {
    reset();
    onFechar();
  }

  async function onArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setArquivo(file.name);
    setErro("");
    setPreview(null);
    setCarregando(true);
    try {
      const form = new FormData();
      form.append("arquivo", file);
      const { data } = await api.post<Preview>("/clientes/importar-preview", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPreview(data);
      if (data.total_lido === 0) setErro("Nenhum cliente foi reconhecido no arquivo.");
    } catch (err: any) {
      setErro(err?.response?.data?.errors?.[0] || "Erro ao ler o arquivo.");
    } finally {
      setCarregando(false);
    }
  }

  async function confirmar() {
    if (!preview?.clientes.length) return;
    setImportando(true);
    setErro("");
    try {
      const { data } = await api.post("/clientes/importar", {
        clientes: preview.clientes,
      });
      alert(
        `Importação concluída:\n` +
          `• ${data.inseridos} novo(s)\n` +
          `• ${data.atualizados} atualizado(s)\n` +
          `• ${data.inalterados} sem mudança`
      );
      reset();
      onImportado();
      onFechar();
    } catch (err: any) {
      setErro(err?.response?.data?.errors?.[0] || "Erro ao importar.");
    } finally {
      setImportando(false);
    }
  }

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-[860px] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-sora text-lg font-bold m-0">Importar clientes de TXT</h3>
          <button onClick={fechar} className="text-[#9AA8A2] hover:text-ink">
            <FiX size={20} />
          </button>
        </div>

        {/* upload */}
        <div className="flex items-center justify-between bg-[#F7FAF9] border border-[#EAEFED] rounded-xl px-4 py-3 mb-4">
          <div className="text-[12.5px] text-[#5A6A63]">
            Selecione o relatório de clientes em texto (formato de colunas fixas).
            {arquivo && <span className="ml-2 font-semibold text-ink">{arquivo}</span>}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.prn,.rel,text/plain"
            onChange={onArquivo}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={carregando}
            className="flex items-center gap-2 h-10 px-4 rounded-[10px] border-[1.5px] border-[#E2E8E6] bg-white text-[13px] font-semibold text-[#34433D] hover:border-brand hover:text-brand-dark disabled:opacity-60 flex-none"
          >
            <FiUploadCloud size={16} />
            {carregando ? "Lendo…" : "Escolher arquivo"}
          </button>
        </div>

        {erro && (
          <div className="mb-3 text-[13px] text-[#C0392B] bg-[#FBE6E3] border border-[#f3c9c2] rounded-[10px] px-3 py-2">
            {erro}
          </div>
        )}

        {preview && (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-3 text-[12.5px]">
              <span className="flex items-center gap-1.5 font-semibold text-brand-dark">
                <FiCheckCircle size={15} /> {preview.total_lido} cliente(s) lido(s)
              </span>
              {preview.total_declarado != null && (
                <span className="text-[#7A8A84]">
                  · arquivo declara {preview.total_declarado}
                </span>
              )}
              <span className="text-[#9AA8A2]">· encoding {preview.encoding}</span>
              {preview.resumo && (
                <span className="flex items-center gap-2">
                  <span className="text-[#0A9E84] font-semibold">{preview.resumo.novos} novo(s)</span>
                  <span className="text-[#C98A0E] font-semibold">{preview.resumo.alterados} alterado(s)</span>
                  <span className="text-[#7A8A84] font-semibold">{preview.resumo.iguais} igual(is)</span>
                </span>
              )}
              {preview.avisos.map((a, i) => (
                <span key={i} className="flex items-center gap-1.5 text-[#C98A0E] font-semibold">
                  <FiAlertTriangle size={14} /> {a}
                </span>
              ))}
            </div>

            <div className="scrl flex-1 overflow-auto border border-[#E7ECEA] rounded-xl">
              <table className="w-full text-[13px] border-collapse">
                <thead className="sticky top-0 bg-[#F4F7F6]">
                  <tr className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#9AA8A2]">
                    <th className="text-left px-3 py-2.5 w-[84px]">Status</th>
                    <th className="text-left px-3 py-2.5 w-[52px]">Cód.</th>
                    <th className="text-left px-3 py-2.5">Nome</th>
                    <th className="text-left px-3 py-2.5 w-[150px]">CNPJ / CPF</th>
                    <th className="text-left px-3 py-2.5 w-[120px]">Telefone</th>
                    <th className="text-left px-3 py-2.5">Cidade</th>
                    <th className="text-left px-3 py-2.5 w-[50px]">UF</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.clientes.map((c, i) => (
                    <tr key={i} className="border-t border-[#F2F5F4] align-top">
                      <td className="px-3 py-2">
                        <StatusTag status={c.status} />
                      </td>
                      <td className="px-3 py-2 font-mono text-[#5A6A63]">{c.codigo}</td>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-ink">{c.nome}</div>
                        {c.fantasia && (
                          <div className="text-[11.5px] text-[#9AA8A2]">{c.fantasia}</div>
                        )}
                        {c.status === "alterado" && c.alteracoes && c.alteracoes.length > 0 && (
                          <div className="mt-1 flex flex-col gap-0.5">
                            {c.alteracoes.map((a, j) => (
                              <div key={j} className="text-[11.5px] text-[#7A8A84]">
                                <span className="font-semibold text-[#C98A0E]">
                                  {ROTULO_CAMPO[a.campo] || a.campo}:
                                </span>{" "}
                                <span className="line-through text-[#B0BBB6]">{a.de || "—"}</span>{" "}
                                → <span className="text-ink">{a.para}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-[#34433D]">{c.doc || "—"}</td>
                      <td className="px-3 py-2 font-mono text-[#34433D]">{c.telefone || "—"}</td>
                      <td className="px-3 py-2 text-[#34433D]">{c.cidade || "—"}</td>
                      <td className="px-3 py-2 font-mono text-[#34433D]">{c.uf || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={fechar}
            className="h-11 px-5 rounded-xl border-[1.5px] border-[#E2E8E6] bg-white text-sm font-semibold text-[#34433D] hover:border-brand"
          >
            Cancelar
          </button>
          <PrimaryButton
            onClick={confirmar}
            disabled={importando || !preview?.clientes.length}
            className="px-6"
          >
            {importando
              ? "Importando…"
              : `Importar ${preview?.clientes.length || 0} cliente(s)`}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
