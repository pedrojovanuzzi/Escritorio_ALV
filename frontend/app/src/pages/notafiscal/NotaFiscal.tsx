import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheckCircle, FiUsers } from "react-icons/fi";
import api from "../../api/api";
import { Cliente } from "../../types";
import { Card, StepHeader, Field, PrimaryButton, ResumoBox } from "../../components/ui";
import { fmtBRL, parseValor } from "../../utils/format";

export const NotaFiscal = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [idx, setIdx] = useState(0);
  const [edits, setEdits] = useState<Partial<Cliente>>({});
  const [valor, setValor] = useState("98,00");
  const [aliquota, setAliquota] = useState("5,00");
  const [discriminacao, setDiscriminacao] = useState(
    "Serviços de passagem de cabo de rede"
  );
  const [itemLista, setItemLista] = useState("14.02.01");
  const [cnae, setCnae] = useState("6209100");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api.get("/clientes").then((r) => setClientes(r.data)).catch(() => {});
  }, []);

  const cliente = clientes[idx];
  const tomador = { ...cliente, ...edits } as Cliente;

  const valorNum = parseValor(valor);
  const aliqNum = parseValor(aliquota);
  const iss = useMemo(() => +(valorNum * (aliqNum / 100)).toFixed(2), [valorNum, aliqNum]);

  function setT(campo: keyof Cliente, v: string) {
    setEdits((e) => ({ ...e, [campo]: v }));
  }

  async function emitir() {
    if (!cliente) return;
    setEnviando(true);
    try {
      const { data } = await api.post("/documentos/nfse", {
        cliente_id: cliente.id,
        cliente_nome: tomador.nome,
        valor: valorNum,
        aliquota: aliqNum,
        discriminacao,
        item_lista: itemLista,
        cnae,
        tomador,
      });
      navigate(`/documento/${data.id}`);
    } catch {
      alert("Erro ao emitir NFS-e.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="px-9 pt-[30px] pb-[60px] grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-[26px] items-start">
      <div className="flex flex-col gap-5">
        {/* 1 - Tomador */}
        <Card>
          <StepHeader n={1} title="Tomador do serviço" />
          <div className="bg-[#F2FBF8] border border-[#CFEDE5] rounded-xl px-4 py-3.5 mb-[18px]">
            <label className="flex items-center gap-2 text-[11.5px] font-bold tracking-[0.04em] uppercase text-brand-dark mb-2">
              <FiUsers size={16} /> Gerar para cliente cadastrado
            </label>
            <select
              value={idx}
              onChange={(e) => {
                setIdx(+e.target.value);
                setEdits({});
              }}
              className="w-full h-11 border-[1.5px] border-[#BFE6DB] rounded-[9px] px-3 text-sm font-semibold bg-white outline-none focus:border-brand cursor-pointer"
            >
              {clientes.map((c, i) => (
                <option key={c.id} value={i}>
                  {c.nome} — {c.doc}
                </option>
              ))}
            </select>
            <div className="text-xs text-[#7FA89C] mt-1.5">
              Os dados do cliente preenchem o tomador abaixo — edite se necessário.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="CPF / CNPJ" value={tomador.doc || ""} onChange={(v) => setT("doc", v)} mono />
            <Field label="Inscrição municipal" value={tomador.inscricao_municipal || ""} onChange={(v) => setT("inscricao_municipal", v)} placeholder="Opcional" />
            <Field label="E-mail" value={tomador.email || ""} onChange={(v) => setT("email", v)} />
            <Field className="sm:col-span-2" label="Razão social / Nome" value={tomador.nome || ""} onChange={(v) => setT("nome", v)} />
            <Field label="Número" value={tomador.numero || ""} onChange={(v) => setT("numero", v)} mono />
            <Field className="sm:col-span-2" label="Endereço" value={tomador.endereco || ""} onChange={(v) => setT("endereco", v)} />
            <Field label="Bairro" value={tomador.bairro || ""} onChange={(v) => setT("bairro", v)} />
            <Field label="Município" value={tomador.municipio || ""} onChange={(v) => setT("municipio", v)} />
            <Field label="CEP" value={tomador.cep || ""} onChange={(v) => setT("cep", v)} mono />
          </div>
        </Card>

        {/* 2 - Descrição */}
        <Card>
          <StepHeader n={2} title="Descrição do serviço" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Item lista serviço" value={itemLista} onChange={setItemLista} mono />
            <Field label="CNAE" value={cnae} onChange={setCnae} mono />
            <Field label="Cód. tributação município" value="0000140200001" mono />
            <div className="sm:col-span-3">
              <label className="block text-[12.5px] font-semibold text-[#5A6A63] mb-1.5">
                Discriminação do serviço
              </label>
              <textarea
                value={discriminacao}
                onChange={(e) => setDiscriminacao(e.target.value)}
                className="w-full h-[78px] border-[1.5px] border-[#E2E8E6] rounded-[10px] p-3 text-[13.5px] resize-y outline-none focus:border-brand leading-relaxed"
              />
            </div>
          </div>
        </Card>

        {/* 3 - Valores */}
        <Card>
          <StepHeader n={3} title="Valores e tributos" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Field label="Valor do serviço" value={valor} onChange={setValor} mono />
            <Field label="Deduções" value="0,00" mono />
            <Field label="Alíquota ISS (%)" value={aliquota} onChange={setAliquota} mono />
            <Field label="Valor ISS" value={fmtBRL(iss)} mono />
          </div>
          <label className="flex items-center gap-2.5 mt-4 text-[13.5px] text-[#34433D]">
            <span className="w-[18px] h-[18px] rounded-md bg-brand inline-flex items-center justify-center text-white flex-none">
              <FiCheckCircle size={12} />
            </span>
            Optante pelo Simples Nacional
          </label>
        </Card>
      </div>

      {/* Resumo */}
      <div className="lg:sticky lg:top-[104px] flex flex-col gap-4">
        <ResumoBox
          titulo="Resumo da NFS-e"
          linhas={[
            { label: "Valor do serviço", valor: fmtBRL(valorNum) },
            { label: "Deduções", valor: fmtBRL(0) },
            { label: `ISS (${aliqNum}%)`, valor: fmtBRL(iss) },
          ]}
          totalLabel="Valor líquido"
          totalValor={fmtBRL(valorNum)}
        />
        <PrimaryButton onClick={emitir} disabled={enviando || !cliente} className="w-full">
          <FiCheckCircle size={18} />
          {enviando ? "Emitindo…" : "Emitir NFS-e"}
        </PrimaryButton>
        <button className="w-full h-11 bg-white text-[#34433D] border-[1.5px] border-[#E2E8E6] rounded-xl text-sm font-semibold hover:border-brand hover:text-brand-dark">
          Salvar rascunho
        </button>
      </div>
    </div>
  );
};
