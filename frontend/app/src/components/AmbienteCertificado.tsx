import React, { useEffect, useRef, useState } from "react";
import { FiUploadCloud, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";
import api from "../api/api";
import { Card } from "./ui";

export type Ambiente = "homologacao" | "producao";

export function AmbienteCertificado({
  ambiente,
  setAmbiente,
}: {
  ambiente: Ambiente;
  setAmbiente: (a: Ambiente) => void;
}) {
  const [certConfigurado, setCertConfigurado] = useState<boolean | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function carregarStatus() {
    api
      .get("/nfse/certificado/status")
      .then((r) => setCertConfigurado(!!r.data.configurado))
      .catch(() => setCertConfigurado(false));
  }
  useEffect(carregarStatus, []);

  async function onArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setEnviando(true);
    setMsg("");
    try {
      const form = new FormData();
      form.append("certificado", file);
      await api.post("/nfse/certificado", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMsg("Certificado A1 enviado com sucesso.");
      carregarStatus();
    } catch {
      setMsg("Falha ao enviar o certificado.");
    } finally {
      setEnviando(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function Opcao({ value, titulo, desc }: { value: Ambiente; titulo: string; desc: string }) {
    const ativo = ambiente === value;
    return (
      <button
        type="button"
        onClick={() => setAmbiente(value)}
        className={`flex-1 text-left rounded-xl border-[1.5px] px-4 py-3 transition-colors ${
          ativo
            ? "border-brand bg-[#F2FBF8]"
            : "border-[#E2E8E6] bg-white hover:border-brand/50"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-4 h-4 rounded-full border-2 flex-none ${
              ativo ? "border-brand bg-brand" : "border-[#CBD5D1]"
            }`}
          />
          <span className="text-sm font-bold text-ink">{titulo}</span>
        </div>
        <div className="text-[12px] text-[#7A8A84] mt-1 ml-6">{desc}</div>
      </button>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="font-sora text-base font-bold m-0 tracking-tight">
          Ambiente de emissão
        </h3>
        {certConfigurado === true && (
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-brand-dark">
            <FiCheckCircle size={15} /> Certificado A1 configurado
          </span>
        )}
        {certConfigurado === false && (
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#C98A0E]">
            <FiAlertTriangle size={15} /> Sem certificado
          </span>
        )}
      </div>

      <div className="flex gap-3 mb-4">
        <Opcao
          value="homologacao"
          titulo="Homologação"
          desc="Ambiente de teste — não tem validade fiscal."
        />
        <Opcao
          value="producao"
          titulo="Produção"
          desc="Emite a nota com validade fiscal real."
        />
      </div>

      <div className="flex items-center justify-between bg-[#F7FAF9] border border-[#EAEFED] rounded-xl px-4 py-3">
        <div className="text-[12.5px] text-[#5A6A63]">
          Certificado digital A1 (.pfx) usado para assinar e transmitir a NFS-e.
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".pfx,.p12"
          onChange={onArquivo}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={enviando}
          className="flex items-center gap-2 h-10 px-4 rounded-[10px] border-[1.5px] border-[#E2E8E6] bg-white text-[13px] font-semibold text-[#34433D] hover:border-brand hover:text-brand-dark disabled:opacity-60 flex-none"
        >
          <FiUploadCloud size={16} />
          {enviando ? "Enviando…" : certConfigurado ? "Trocar certificado" : "Enviar certificado"}
        </button>
      </div>
      {msg && <div className="text-[12px] text-brand-dark mt-2">{msg}</div>}

      {ambiente === "producao" && certConfigurado === false && (
        <div className="text-[12px] text-[#C0392B] bg-[#FBE6E3] border border-[#f3c9c2] rounded-[10px] px-3 py-2 mt-3">
          Para emitir em produção é necessário enviar o certificado A1 e configurar a
          senha (NFSE_CERT_PASSWORD) no backend.
        </div>
      )}
    </Card>
  );
}
