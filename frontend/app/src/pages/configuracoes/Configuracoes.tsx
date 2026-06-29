import React, { useEffect, useState } from "react";
import { FiSave, FiCheckCircle } from "react-icons/fi";
import api from "../../api/api";
import {
  Configuracoes as Config,
  ConfigNfse,
  ConfigBoleto,
  ConfigEmpresa,
} from "../../types";
import { Card, StepHeader, Field, PrimaryButton } from "../../components/ui";

export const Configuracoes = () => {
  const [empresa, setEmpresa] = useState<ConfigEmpresa | null>(null);
  const [nfse, setNfse] = useState<ConfigNfse | null>(null);
  const [boleto, setBoleto] = useState<ConfigBoleto | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api
      .get<Config>("/configuracoes")
      .then((r) => {
        setEmpresa(r.data.empresa);
        setNfse(r.data.nfse);
        setBoleto(r.data.boleto);
      })
      .catch(() => {});
  }, []);

  function setE<K extends keyof ConfigEmpresa>(k: K, v: ConfigEmpresa[K]) {
    setEmpresa((c) => (c ? { ...c, [k]: v } : c));
  }
  function setN<K extends keyof ConfigNfse>(k: K, v: ConfigNfse[K]) {
    setNfse((c) => (c ? { ...c, [k]: v } : c));
  }
  function setB<K extends keyof ConfigBoleto>(k: K, v: ConfigBoleto[K]) {
    setBoleto((c) => (c ? { ...c, [k]: v } : c));
  }

  async function salvar() {
    if (!empresa || !nfse || !boleto) return;
    setSalvando(true);
    setMsg("");
    try {
      await api.put("/configuracoes", { empresa, nfse, boleto });
      setMsg("Configurações salvas com sucesso.");
      setTimeout(() => setMsg(""), 3500);
    } catch {
      setMsg("Erro ao salvar configurações.");
    } finally {
      setSalvando(false);
    }
  }

  if (!empresa || !nfse || !boleto) {
    return <div className="px-9 py-16 text-center text-[#9AA8A2]">Carregando…</div>;
  }

  return (
    <div className="px-9 pt-[26px] pb-[60px] max-w-[920px]">
      <p className="text-[13.5px] text-[#7A8A84] mb-5">
        Estes valores são usados para pré-preencher os formulários de emissão de NFS-e e
        boletos. Você ainda pode ajustá-los individualmente em cada emissão.
      </p>

      {/* Empresa emitente (prestador) */}
      <Card className="mb-5">
        <StepHeader n={1} title="Empresa emitente (prestador)" />
        <p className="text-[12.5px] text-[#7A8A84] -mt-2 mb-4">
          Estes são os seus dados — a empresa que emite a NFS-e (prestador) e cobra os boletos
          (beneficiário).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
          <Field className="sm:col-span-4" label="Razão social" value={empresa.razao_social} onChange={(v) => setE("razao_social", v)} />
          <Field className="sm:col-span-2" label="Nome fantasia" value={empresa.nome_fantasia} onChange={(v) => setE("nome_fantasia", v)} />
          <Field className="sm:col-span-2" label="CNPJ" value={empresa.cnpj} onChange={(v) => setE("cnpj", v)} mono />
          <Field className="sm:col-span-2" label="Inscrição municipal" value={empresa.inscricao_municipal} onChange={(v) => setE("inscricao_municipal", v)} mono />
          <Field className="sm:col-span-2" label="Inscrição estadual" value={empresa.inscricao_estadual} onChange={(v) => setE("inscricao_estadual", v)} mono />
          <Field className="sm:col-span-2" label="CNAE" value={empresa.cnae} onChange={(v) => setE("cnae", v)} mono />
          <Field className="sm:col-span-2" label="Cód. município (IBGE)" value={empresa.codigo_municipio} onChange={(v) => setE("codigo_municipio", v)} mono />
          <Field className="sm:col-span-2" label="Telefone" value={empresa.telefone} onChange={(v) => setE("telefone", v)} mono />
        </div>

        <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#9AA8A2] mt-5 mb-3">Endereço</div>
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
          <Field className="sm:col-span-4" label="Endereço" value={empresa.endereco} onChange={(v) => setE("endereco", v)} />
          <Field className="sm:col-span-1" label="Número" value={empresa.numero} onChange={(v) => setE("numero", v)} mono />
          <Field className="sm:col-span-1" label="CEP" value={empresa.cep} onChange={(v) => setE("cep", v)} mono />
          <Field className="sm:col-span-2" label="Complemento" value={empresa.complemento} onChange={(v) => setE("complemento", v)} />
          <Field className="sm:col-span-2" label="Bairro" value={empresa.bairro} onChange={(v) => setE("bairro", v)} />
          <Field className="sm:col-span-1" label="Município" value={empresa.municipio} onChange={(v) => setE("municipio", v)} />
          <Field className="sm:col-span-1" label="UF" value={empresa.uf} onChange={(v) => setE("uf", v.toUpperCase().slice(0, 2))} mono />
          <Field className="sm:col-span-3" label="E-mail" value={empresa.email} onChange={(v) => setE("email", v)} />
        </div>

        <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#9AA8A2] mt-5 mb-3">Dados bancários (boleto)</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Banco" value={empresa.banco} onChange={(v) => setE("banco", v)} />
          <Field label="Agência" value={empresa.agencia} onChange={(v) => setE("agencia", v)} mono />
          <Field label="Conta" value={empresa.conta} onChange={(v) => setE("conta", v)} mono />
        </div>
      </Card>

      {/* NFS-e */}
      <Card className="mb-5">
        <StepHeader n={2} title="NFS-e padrão" />
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
        </div>
        <p className="text-[12px] text-[#7A8A84] mt-3">
          Item da lista de serviço, CNAE, alíquota, regime de tributação, código de tributação do
          município e discriminação são definidos por <strong>cliente</strong> (no cadastro do
          cliente) e usados para pré-preencher cada emissão.
        </p>
        <div className="flex flex-wrap gap-5 mt-4">
          <Check label="ISS retido na fonte" checked={nfse.iss_retido} onChange={(v) => setN("iss_retido", v)} />
        </div>

        <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#9AA8A2] mt-5 mb-3">
          Acesso ao webservice da prefeitura
        </div>
        <p className="text-[12.5px] text-[#7A8A84] -mt-1 mb-3">
          Login do contribuinte no provedor (pode ser diferente do CNPJ). Usado para autenticar o envio da NFS-e.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[12.5px] font-semibold text-[#5A6A63] mb-1.5">
              Próximo número de RPS
            </label>
            <input
              value={String(nfse.proximo_rps ?? "")}
              onChange={(e) => setN("proximo_rps", Number(e.target.value.replace(/\D/g, "")) || 0)}
              className="w-full h-[42px] border-[1.5px] border-[#E2E8E6] rounded-[10px] px-3 text-[13.5px] font-mono bg-white outline-none focus:border-brand"
            />
          </div>
          <Field label="Usuário (username)" value={nfse.ws_username} onChange={(v) => setN("ws_username", v)} mono />
          <div>
            <label className="block text-[12.5px] font-semibold text-[#5A6A63] mb-1.5">
              Senha (password)
            </label>
            <input
              type="password"
              value={nfse.ws_password}
              onChange={(e) => setN("ws_password", e.target.value)}
              autoComplete="new-password"
              className="w-full h-[42px] border-[1.5px] border-[#E2E8E6] rounded-[10px] px-3 text-[13.5px] font-mono bg-white outline-none focus:border-brand"
            />
          </div>
        </div>
      </Card>

      {/* Boleto */}
      <Card className="mb-5">
        <StepHeader n={3} title="Boleto padrão" />
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
