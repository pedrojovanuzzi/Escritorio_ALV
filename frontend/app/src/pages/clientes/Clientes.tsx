import React, { useEffect, useState } from "react";
import { FiPlus, FiFileText, FiEdit2, FiX, FiTrash2, FiUpload } from "react-icons/fi";
import api from "../../api/api";
import { Cliente } from "../../types";
import { iniciais, corPorIndice } from "../../utils/format";
import { Field, PrimaryButton } from "../../components/ui";
import { ImportarClientesModal } from "../../components/ImportarClientesModal";

const VAZIO: Cliente = { nome: "", doc: "", tipo: "PJ", email: "", municipio: "" };

export const Clientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtro, setFiltro] = useState<"" | "PJ" | "PF">("");
  const [importar, setImportar] = useState(false);
  const [modal, setModal] = useState<Cliente | null>(null);

  function carregar() {
    api.get("/clientes").then((r) => setClientes(r.data)).catch(() => {});
  }
  useEffect(carregar, []);

  const visiveis = filtro ? clientes.filter((c) => c.tipo === filtro) : clientes;
  const pj = clientes.filter((c) => c.tipo === "PJ").length;
  const pf = clientes.filter((c) => c.tipo === "PF").length;

  function setM<K extends keyof Cliente>(campo: K, valor: any) {
    setModal((m) => (m ? { ...m, [campo]: valor } : m));
  }

  async function salvar() {
    if (!modal) return;
    try {
      if (modal.id) await api.put(`/clientes/${modal.id}`, modal);
      else await api.post("/clientes", modal);
      setModal(null);
      carregar();
    } catch {
      alert("Erro ao salvar cliente.");
    }
  }

  async function remover(id?: number) {
    if (!id || !window.confirm("Remover este cliente?")) return;
    await api.delete(`/clientes/${id}`);
    carregar();
  }

  function Tab({ label, count, value }: { label: string; count: number; value: "" | "PJ" | "PF" }) {
    const ativo = filtro === value;
    return (
      <button
        onClick={() => setFiltro(value)}
        className={`h-[38px] px-4 rounded-[10px] text-[13.5px] font-semibold ${
          ativo
            ? "bg-panel text-white border-none"
            : "bg-white text-[#5A6A63] border border-[#E2E8E6] hover:border-brand"
        }`}
      >
        {label} · {count}
      </button>
    );
  }

  return (
    <div className="px-9 pt-[26px] pb-[60px]">
      <div className="flex items-center justify-between mb-[18px]">
        <div className="flex gap-2.5">
          <Tab label="Todos" count={clientes.length} value="" />
          <Tab label="Pessoa Jurídica" count={pj} value="PJ" />
          <Tab label="Pessoa Física" count={pf} value="PF" />
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setImportar(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-[11px] border-[1.5px] border-[#E2E8E6] bg-white text-sm font-semibold text-[#34433D] hover:border-brand hover:text-brand-dark"
          >
            <FiUpload size={16} /> Importar TXT
          </button>
          <PrimaryButton onClick={() => setModal({ ...VAZIO })} className="px-[18px] !h-10 !text-sm">
            <FiPlus size={17} /> Novo cliente
          </PrimaryButton>
        </div>
      </div>

      <div className="bg-white border border-[#E7ECEA] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[2.4fr_1.4fr_0.7fr_1.4fr_1fr] px-[22px] py-3.5 border-b border-[#EEF2F0] text-[11.5px] font-bold tracking-[0.06em] uppercase text-[#9AA8A2]">
          <div>Cliente</div>
          <div>CPF / CNPJ</div>
          <div>Tipo</div>
          <div>Cidade</div>
          <div className="text-right">Ações</div>
        </div>
        {visiveis.map((c, i) => (
          <div
            key={c.id}
            className="grid grid-cols-[2.4fr_1.4fr_0.7fr_1.4fr_1fr] px-[22px] py-[15px] border-b border-[#F2F5F4] items-center hover:bg-[#F8FBFA]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-[38px] h-[38px] rounded-[10px] text-white flex items-center justify-center font-sora font-bold text-[13px] flex-none"
                style={{ background: corPorIndice(i) }}
              >
                {iniciais(c.nome)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{c.nome}</div>
                <div className="text-xs text-[#9AA8A2] truncate">{c.email}</div>
              </div>
            </div>
            <div className="text-[13px] font-mono text-[#34433D]">{c.doc}</div>
            <div>
              <span className="text-[11.5px] font-bold px-2.5 py-1 rounded-md bg-[#EEF1F0] text-[#5A6A63]">
                {c.tipo}
              </span>
            </div>
            <div className="text-[13px] text-[#5A6A63]">{c.municipio}</div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setModal({ ...c })}
                className="w-8 h-8 rounded-lg border border-[#E2E8E6] bg-white flex items-center justify-center hover:border-brand"
              >
                <FiEdit2 size={15} className="text-[#5A6A63]" />
              </button>
              <button
                onClick={() => remover(c.id)}
                className="w-8 h-8 rounded-lg border border-[#E2E8E6] bg-white flex items-center justify-center hover:border-[#C0392B]"
              >
                <FiTrash2 size={15} className="text-[#C0392B]" />
              </button>
            </div>
          </div>
        ))}
        {visiveis.length === 0 && (
          <div className="px-[22px] py-10 text-center text-[#9AA8A2] text-sm">
            <FiFileText className="inline mb-2" size={22} />
            <div>Nenhum cliente cadastrado.</div>
          </div>
        )}
      </div>

      {/* Modal criar/editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-[760px] max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-[#EEF2F0]">
              <h3 className="font-sora text-lg font-bold m-0">
                {modal.id ? "Editar cliente" : "Novo cliente"}
              </h3>
              <button onClick={() => setModal(null)} className="text-[#9AA8A2] hover:text-ink">
                <FiX size={20} />
              </button>
            </div>

            <div className="scrl overflow-y-auto px-6 py-5 flex flex-col gap-5">
              {/* Identificação */}
              <Secao titulo="Identificação">
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                  <Field className="sm:col-span-1" label="Código" value={modal.codigo_externo || ""} onChange={(v) => setM("codigo_externo", v)} mono />
                  <Field className="sm:col-span-3" label="Nome / Razão social" value={modal.nome} onChange={(v) => setM("nome", v)} />
                  <Field className="sm:col-span-2" label="Nome fantasia" value={modal.nome_fantasia || ""} onChange={(v) => setM("nome_fantasia", v)} />
                  <Field className="sm:col-span-2" label="CPF / CNPJ" value={modal.doc} onChange={(v) => setM("doc", v)} mono />
                  <div className="sm:col-span-2">
                    <label className="block text-[12.5px] font-semibold text-[#5A6A63] mb-1.5">Tipo</label>
                    <select
                      value={modal.tipo}
                      onChange={(e) => setM("tipo", e.target.value)}
                      className="w-full h-[42px] border-[1.5px] border-[#E2E8E6] rounded-[10px] px-3 text-[13.5px] bg-white outline-none focus:border-brand"
                    >
                      <option value="PJ">Pessoa Jurídica</option>
                      <option value="PF">Pessoa Física</option>
                    </select>
                  </div>
                  <Field className="sm:col-span-2" label="Natureza jurídica" value={modal.natureza_juridica || ""} onChange={(v) => setM("natureza_juridica", v)} />
                </div>
              </Secao>

              {/* Contato */}
              <Secao titulo="Contato">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="E-mail" value={modal.email || ""} onChange={(v) => setM("email", v)} />
                  <Field label="Telefone" value={modal.telefone || ""} onChange={(v) => setM("telefone", v)} mono />
                </div>
              </Secao>

              {/* Endereço */}
              <Secao titulo="Endereço">
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                  <Field className="sm:col-span-4" label="Endereço" value={modal.endereco || ""} onChange={(v) => setM("endereco", v)} />
                  <Field className="sm:col-span-1" label="Número" value={modal.numero || ""} onChange={(v) => setM("numero", v)} mono />
                  <Field className="sm:col-span-1" label="CEP" value={modal.cep || ""} onChange={(v) => setM("cep", v)} mono />
                  <Field className="sm:col-span-2" label="Complemento" value={modal.complemento || ""} onChange={(v) => setM("complemento", v)} />
                  <Field className="sm:col-span-2" label="Bairro" value={modal.bairro || ""} onChange={(v) => setM("bairro", v)} />
                  <Field className="sm:col-span-1" label="Município" value={modal.municipio || ""} onChange={(v) => setM("municipio", v)} />
                  <Field className="sm:col-span-1" label="UF" value={modal.uf || ""} onChange={(v) => setM("uf", v.toUpperCase().slice(0, 2))} mono />
                </div>
              </Secao>

              {/* Dados fiscais */}
              <Secao titulo="Dados fiscais">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Insc. municipal" value={modal.inscricao_municipal || ""} onChange={(v) => setM("inscricao_municipal", v)} mono />
                  <Field label="Insc. estadual" value={modal.inscricao_estadual || ""} onChange={(v) => setM("inscricao_estadual", v)} mono />
                  <Field label="CNAE" value={modal.cnae || ""} onChange={(v) => setM("cnae", v)} mono />
                  <Field label="Capital social" value={modal.capital_social || ""} onChange={(v) => setM("capital_social", v)} mono />
                  <Field label="Contador" value={modal.contador || ""} onChange={(v) => setM("contador", v)} />
                  <Field label="Responsável legal" value={modal.responsavel_legal || ""} onChange={(v) => setM("responsavel_legal", v)} />
                </div>
              </Secao>
            </div>

            <div className="flex justify-end gap-3 p-6 pt-4 border-t border-[#EEF2F0]">
              <button
                onClick={() => setModal(null)}
                className="h-11 px-5 rounded-xl border-[1.5px] border-[#E2E8E6] bg-white text-sm font-semibold text-[#34433D] hover:border-brand"
              >
                Cancelar
              </button>
              <PrimaryButton onClick={salvar} className="px-6">
                Salvar cliente
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      <ImportarClientesModal
        aberto={importar}
        onFechar={() => setImportar(false)}
        onImportado={carregar}
      />
    </div>
  );
};

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#9AA8A2] mb-3">
        {titulo}
      </div>
      {children}
    </div>
  );
}
