import React, { useEffect, useRef, useState } from "react";
import { FiX, FiLock, FiShield } from "react-icons/fi";
import { PrimaryButton } from "./ui";

/**
 * Popup para informar a senha do certificado A1 no momento da emissão.
 * A senha não é persistida — é usada só para assinar/transmitir a NFS-e.
 */
export function SenhaCertificadoModal({
  aberto,
  ambiente,
  enviando,
  onCancelar,
  onConfirmar,
}: {
  aberto: boolean;
  ambiente: "homologacao" | "producao";
  enviando: boolean;
  onCancelar: () => void;
  onConfirmar: (senha: string) => void;
}) {
  const [senha, setSenha] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aberto) {
      setSenha("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [aberto]);

  if (!aberto) return null;

  function confirmar() {
    onConfirmar(senha);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-[420px]">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-[#E6F7F3] flex items-center justify-center text-brand-dark flex-none">
              <FiShield size={18} />
            </div>
            <h3 className="font-sora text-lg font-bold m-0">Senha do certificado</h3>
          </div>
          <button onClick={onCancelar} className="text-[#9AA8A2] hover:text-ink">
            <FiX size={20} />
          </button>
        </div>

        <p className="text-[13px] text-[#6B7B75] mt-1 mb-4">
          Informe a senha do certificado digital A1 para assinar e transmitir a NFS-e em{" "}
          <strong className="text-ink">
            {ambiente === "producao" ? "produção" : "homologação"}
          </strong>
          . A senha não é armazenada.
        </p>

        <label className="block text-[13px] font-semibold text-[#34433D] mb-[7px]">
          Senha do certificado (.pfx)
        </label>
        <div className="relative mb-1">
          <FiLock className="absolute left-3.5 top-3.5 text-[#9AA8A2]" size={16} />
          <input
            ref={inputRef}
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && senha) confirmar();
            }}
            placeholder="••••••••"
            className="w-full h-[46px] border-[1.5px] border-[#E2E8E6] rounded-[11px] pl-[38px] pr-3.5 text-[14.5px] bg-white outline-none focus:border-brand"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancelar}
            disabled={enviando}
            className="h-11 px-5 rounded-xl border-[1.5px] border-[#E2E8E6] bg-white text-sm font-semibold text-[#34433D] hover:border-brand disabled:opacity-60"
          >
            Cancelar
          </button>
          <PrimaryButton onClick={confirmar} disabled={enviando || !senha} className="px-6">
            {enviando ? "Emitindo…" : "Assinar e emitir"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
