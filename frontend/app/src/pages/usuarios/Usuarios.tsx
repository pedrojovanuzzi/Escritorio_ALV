import React, { useEffect, useState } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUserPlus, FiMail, FiLock } from "react-icons/fi";
import api from "../../api/api";
import { Usuario } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { iniciais, corPorIndice } from "../../utils/format";
import { Field, PrimaryButton } from "../../components/ui";

const VAZIO: Usuario = { nome: "", email: "", cargo: "Contador", password: "" };

export const Usuarios = () => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [modal, setModal] = useState<Usuario | null>(null);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  function carregar() {
    api.get("/usuarios").then((r) => setUsuarios(r.data)).catch(() => {});
  }
  useEffect(carregar, []);

  async function salvar() {
    if (!modal) return;
    setErro("");
    setSalvando(true);
    try {
      if (modal.id) await api.put(`/usuarios/${modal.id}`, modal);
      else await api.post("/usuarios", modal);
      setModal(null);
      carregar();
    } catch (e: any) {
      setErro(e?.response?.data?.errors?.[0] || "Erro ao salvar usuário.");
    } finally {
      setSalvando(false);
    }
  }

  async function remover(u: Usuario) {
    if (!u.id || !window.confirm(`Remover o usuário "${u.nome}"?`)) return;
    try {
      await api.delete(`/usuarios/${u.id}`);
      carregar();
    } catch (e: any) {
      alert(e?.response?.data?.errors?.[0] || "Erro ao remover usuário.");
    }
  }

  const editando = !!modal?.id;

  return (
    <div className="px-9 pt-[26px] pb-[60px]">
      <div className="flex items-center justify-between mb-[18px]">
        <div className="text-[13.5px] text-[#7A8A84]">
          {usuarios.length} usuário(s) com acesso ao sistema
        </div>
        <PrimaryButton onClick={() => setModal({ ...VAZIO })} className="px-[18px] !h-10 !text-sm">
          <FiUserPlus size={17} /> Novo usuário
        </PrimaryButton>
      </div>

      <div className="bg-white border border-[#E7ECEA] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[2.4fr_2fr_1.2fr_0.8fr] px-[22px] py-3.5 border-b border-[#EEF2F0] text-[11.5px] font-bold tracking-[0.06em] uppercase text-[#9AA8A2]">
          <div>Usuário</div>
          <div>E-mail</div>
          <div>Cargo</div>
          <div className="text-right">Ações</div>
        </div>
        {usuarios.map((u, i) => (
          <div
            key={u.id}
            className="grid grid-cols-[2.4fr_2fr_1.2fr_0.8fr] px-[22px] py-[15px] border-b border-[#F2F5F4] items-center hover:bg-[#F8FBFA]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-[38px] h-[38px] rounded-[10px] text-white flex items-center justify-center font-sora font-bold text-[13px] flex-none"
                style={{ background: corPorIndice(i) }}
              >
                {iniciais(u.nome)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">
                  {u.nome}
                  {u.id === user?.id && (
                    <span className="ml-2 text-[11px] font-bold text-brand-dark bg-[#E6F7F3] px-1.5 py-0.5 rounded">
                      você
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-[13px] text-[#34433D] truncate">{u.email}</div>
            <div>
              <span className="text-[11.5px] font-bold px-2.5 py-1 rounded-md bg-[#EEF1F0] text-[#5A6A63]">
                {u.cargo || "—"}
              </span>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setModal({ ...u, password: "" })}
                className="w-8 h-8 rounded-lg border border-[#E2E8E6] bg-white flex items-center justify-center hover:border-brand"
              >
                <FiEdit2 size={15} className="text-[#5A6A63]" />
              </button>
              <button
                onClick={() => remover(u)}
                disabled={u.id === user?.id}
                title={u.id === user?.id ? "Não é possível remover a própria conta" : "Remover"}
                className="w-8 h-8 rounded-lg border border-[#E2E8E6] bg-white flex items-center justify-center hover:border-[#C0392B] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FiTrash2 size={15} className="text-[#C0392B]" />
              </button>
            </div>
          </div>
        ))}
        {usuarios.length === 0 && (
          <div className="px-[22px] py-10 text-center text-[#9AA8A2] text-sm">
            Nenhum usuário cadastrado.
          </div>
        )}
      </div>

      {/* Modal criar/editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-[480px]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-sora text-lg font-bold m-0">
                {editando ? "Editar usuário" : "Novo usuário"}
              </h3>
              <button onClick={() => setModal(null)} className="text-[#9AA8A2] hover:text-ink">
                <FiX size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Field
                label="Nome completo"
                value={modal.nome}
                onChange={(v) => setModal({ ...modal, nome: v })}
              />
              <div>
                <label className="block text-[12.5px] font-semibold text-[#5A6A63] mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-3 text-[#9AA8A2]" size={16} />
                  <input
                    type="email"
                    value={modal.email}
                    onChange={(e) => setModal({ ...modal, email: e.target.value })}
                    className="w-full h-[42px] border-[1.5px] border-[#E2E8E6] rounded-[10px] pl-9 pr-3 text-[13.5px] outline-none focus:border-brand"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12.5px] font-semibold text-[#5A6A63] mb-1.5">
                    Cargo
                  </label>
                  <select
                    value={modal.cargo || "Contador"}
                    onChange={(e) => setModal({ ...modal, cargo: e.target.value })}
                    className="w-full h-[42px] border-[1.5px] border-[#E2E8E6] rounded-[10px] px-3 text-[13.5px] bg-white outline-none focus:border-brand"
                  >
                    <option>Contador</option>
                    <option>Contador responsável</option>
                    <option>Assistente</option>
                    <option>Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12.5px] font-semibold text-[#5A6A63] mb-1.5">
                    {editando ? "Nova senha" : "Senha"}
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-3 text-[#9AA8A2]" size={16} />
                    <input
                      type="password"
                      value={modal.password || ""}
                      onChange={(e) => setModal({ ...modal, password: e.target.value })}
                      placeholder={editando ? "Deixe em branco p/ manter" : "Mín. 6 caracteres"}
                      className="w-full h-[42px] border-[1.5px] border-[#E2E8E6] rounded-[10px] pl-9 pr-3 text-[13.5px] outline-none focus:border-brand"
                    />
                  </div>
                </div>
              </div>
            </div>

            {erro && (
              <div className="mt-4 text-[13px] text-[#C0392B] bg-[#FBE6E3] border border-[#f3c9c2] rounded-[10px] px-3 py-2">
                {erro}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModal(null)}
                className="h-11 px-5 rounded-xl border-[1.5px] border-[#E2E8E6] bg-white text-sm font-semibold text-[#34433D] hover:border-brand"
              >
                Cancelar
              </button>
              <PrimaryButton onClick={salvar} disabled={salvando} className="px-6">
                {salvando ? "Salvando…" : editando ? "Salvar alterações" : "Criar usuário"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
