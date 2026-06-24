import React, { useEffect, useState } from "react";
import { FiSave, FiCheckCircle } from "react-icons/fi";
import api from "../../api/api";
import { Configuracoes as Config, ConfigNfse, ConfigBoleto } from "../../types";
import { Card, StepHeader, Field, PrimaryButton } from "../../components/ui";

export const Configuracoes = () => {
  const [nfse, setNfse] = useState<ConfigNfse | null>(null);
  const [boleto, setBoleto] = useState<ConfigBoleto | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api
      .get<Config>("/configuracoes")
      .then((r) => {
        setNfse(r.data.nfse);
        setBoleto(r.data.boleto);
      })
      .catch(() => {});
  }, []);

  function setN<K extends keyof ConfigNfse>(k: K, v: ConfigNfse[K]) {
    setNfse((c) => (c ? { ...c, [k]: v } : c));
  }
  function setB<K extends keyof ConfigBoleto>(k: K, v: ConfigBoleto[K]) {
    setBoleto((c) => (c ? { ...c, [k]: v } : c));
  }

  async function salvar() {
    if (!nfse || !boleto) return;
    setSalvando(true);
    setMsg("");
    try {
      await api.put("/configuracoes", { nfse, boleto });
      setMsg("Configurações salvas com sucesso.");
      setTimeout(() => setMsg(""), 3500);
    } catch {
      setMsg("Erro ao salvar configurações.");
    } finally {
      setSalvando(false);
    }
  }

  if (!nfse || !boleto) {
    return <div className="px-9 py-16 text-center text-[#9AA8A2]">Carregando…</div>;
  }

  return (
    <div className="px-9 pt-[26px] pb-[60px] max-w-[920px]">
      <p className="text-[13.5px] text-[#7A8A84] mb-5">
        Estes valores são usados para pré-preencher os formulários de emissão de NFS-e e
        boletos. Você ainda pode ajustá-los individualmente em cada emissão.
      </p>

      {/* NFS-e */}
      <Card className="mb-5">
        <StepHeader n={1} title="NFS-e padrão" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[12.5px] font-semibold text-[#5A6A63] mb-1.5">
              Ambiente padrão
            </label>
            <select
              value={nfse.ambiente}
              onChange={(e) => setN("ambiente", e.target.value as ConfigNfse["ambiente"])}
              className="w-full h-[42px] border-[1.5px] border-[#E2E8E6] rounded-[10px] px-3 text-[13.5px] bg-white outline-none focus:border-brand"
            >
              <option value="homologacao">Homologação</option>
              <option value="producao">Produção</option>
            </select>
          </div>
          <Field label="Item lista serviço" value={nfse.item_lista} onChange={(v) => setN("item_lista", v)} mono />
          <Field label="CNAE" value={nfse.cnae} onChange={(v) => setN("cnae", v)} mono />
          <Field label="Cód. tributação município" value={nfse.cod_tributacao_municipio} onChange={(v) => setN("cod_tributacao_municipio", v)} mono />
          <Field label="Alíquota ISS (%)" value={nfse.aliquota} onChange={(v) => setN("aliquota", v)} mono />
          <div>
            <label className="block text-[12.5px] font-semibold text-[#5A6A63] mb-1.5">
              Regime de tributação
            </label>
            <select
              value={nfse.regime}
              onChange={(e) => setN("regime", e.target.value)}
              className="w-full h-[42px] border-[1.5px] border-[#E2E8E6] rounded-[10px] px-3 text-[13.5px] bg-white outline-none focus:border-brand"
            >
              <option>Simples Nacional — ME/EPP</option>
              <option>Lucro Presumido</option>
              <option>Lucro Real</option>
            </select>
          </div>
          <div className="sm:col-span-3">
            <label className="block text-[12.5px] font-semibold text-[#5A6A63] mb-1.5">
              Discriminação padrão do serviço
            </label>
            <textarea
              value={nfse.discriminacao}
              onChange={(e) => setN("discriminacao", e.target.value)}
              placeholder="Texto sugerido para a discriminação do serviço"
              className="w-full h-[70px] border-[1.5px] border-[#E2E8E6] rounded-[10px] p-3 text-[13.5px] resize-y outline-none focus:border-brand leading-relaxed"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-5 mt-4">
          <Check label="Optante pelo Simples Nacional" checked={nfse.optante_simples} onChange={(v) => setN("optante_simples", v)} />
          <Check label="ISS retido na fonte" checked={nfse.iss_retido} onChange={(v) => setN("iss_retido", v)} />
        </div>
      </Card>

      {/* Boleto */}
      <Card className="mb-5">
        <StepHeader n={2} title="Boleto padrão" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[12.5px] font-semibold text-[#5A6A63] mb-1.5">Banco</label>
            <select
              value={boleto.banco}
              onChange={(e) => setB("banco", e.target.value)}
              className="w-full h-[42px] border-[1.5px] border-[#E2E8E6] rounded-[10px] px-3 text-[13.5px] bg-white outline-none focus:border-brand"
            >
              <option>001 — Banco do Brasil</option>
              <option>237 — Bradesco</option>
              <option>341 — Itaú</option>
            </select>
          </div>
          <div>
            <label className="block text-[12.5px] font-semibold text-[#5A6A63] mb-1.5">Carteira</label>
            <select
              value={boleto.carteira}
              onChange={(e) => setB("carteira", e.target.value)}
              className="w-full h-[42px] border-[1.5px] border-[#E2E8E6] rounded-[10px] px-3 text-[13.5px] bg-white outline-none focus:border-brand"
            >
              <option>17 — Registrada</option>
              <option>11 — Simples</option>
            </select>
          </div>
          <div>
            <label className="block text-[12.5px] font-semibold text-[#5A6A63] mb-1.5">Espécie</label>
            <select
              value={boleto.especie}
              onChange={(e) => setB("especie", e.target.value)}
              className="w-full h-[42px] border-[1.5px] border-[#E2E8E6] rounded-[10px] px-3 text-[13.5px] bg-white outline-none focus:border-brand"
            >
              <option>DS — Duplicata de Serviço</option>
              <option>DM — Duplicata Mercantil</option>
            </select>
          </div>
          <Field label="Multa por atraso (%)" value={boleto.multa} onChange={(v) => setB("multa", v)} mono />
          <Field label="Juros ao mês (%)" value={boleto.juros} onChange={(v) => setB("juros", v)} mono />
          <Field label="Desconto até venc." value={boleto.desconto} onChange={(v) => setB("desconto", v)} mono />
          <Field
            label="Vencimento padrão (dias)"
            value={String(boleto.dias_vencimento)}
            onChange={(v) => setB("dias_vencimento", Number(v.replace(/\D/g, "")) || 0)}
            mono
          />
          <div className="sm:col-span-3">
            <label className="block text-[12.5px] font-semibold text-[#5A6A63] mb-1.5">
              Instruções padrão ao caixa
            </label>
            <textarea
              value={boleto.instrucoes}
              onChange={(e) => setB("instrucoes", e.target.value)}
              className="w-full h-[70px] border-[1.5px] border-[#E2E8E6] rounded-[10px] p-3 text-[13.5px] resize-y outline-none focus:border-brand leading-relaxed"
            />
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-4">
        <PrimaryButton onClick={salvar} disabled={salvando} className="px-6">
          <FiSave size={17} />
          {salvando ? "Salvando…" : "Salvar configurações"}
        </PrimaryButton>
        {msg && (
          <span className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-dark">
            <FiCheckCircle size={15} /> {msg}
          </span>
        )}
      </div>
    </div>
  );
};

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 text-[13.5px] text-[#34433D] cursor-pointer select-none">
      <span
        onClick={() => onChange(!checked)}
        className="w-[18px] h-[18px] rounded-md inline-flex items-center justify-center flex-none border-2"
        style={{
          background: checked ? "#0FB99A" : "#fff",
          borderColor: checked ? "#0FB99A" : "#CBD5D1",
        }}
      >
        {checked && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      {label}
    </label>
  );
}
