import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCreditCard, FiUsers } from "react-icons/fi";
import api from "../../api/api";
import { Cliente } from "../../types";
import { Card, StepHeader, Field, PrimaryButton, ResumoBox } from "../../components/ui";
import { fmtBRL, parseValor } from "../../utils/format";

export const Boleto = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [idx, setIdx] = useState(0);
  const [edits, setEdits] = useState<Partial<Cliente>>({});
  const [valor, setValor] = useState("2.450,00");
  const [vencimento, setVencimento] = useState("10/07/2026");
  const [numeroDoc, setNumeroDoc] = useState("00094812");
  const [banco, setBanco] = useState("001 — Banco do Brasil");
  const [multa, setMulta] = useState("2,00");
  const [juros, setJuros] = useState("1,00");
  const [instrucoes, setInstrucoes] = useState(
    "Não receber após 30 dias do vencimento. Referente à prestação de serviços — junho/2026."
  );
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api.get("/clientes").then((r) => setClientes(r.data)).catch(() => {});
    // Carrega os padrões definidos em Configurações.
    api
      .get("/configuracoes")
      .then((r) => {
        const c = r.data?.boleto;
        if (!c) return;
        if (c.banco) setBanco(c.banco);
        if (c.multa) setMulta(c.multa);
        if (c.juros) setJuros(c.juros);
        if (c.instrucoes) setInstrucoes(c.instrucoes);
        if (c.dias_vencimento) {
          const d = new Date();
          d.setDate(d.getDate() + Number(c.dias_vencimento));
          setVencimento(d.toLocaleDateString("pt-BR"));
        }
      })
      .catch(() => {});
  }, []);

  const cliente = clientes[idx];
  const pagador = { ...cliente, ...edits } as Cliente;
  const valorNum = parseValor(valor);

  function setP(campo: keyof Cliente, v: string) {
    setEdits((e) => ({ ...e, [campo]: v }));
  }

  async function gerar() {
    if (!cliente) return;
    setEnviando(true);
    try {
      const { data } = await api.post("/documentos/boleto", {
        cliente_id: cliente.id,
        cliente_nome: pagador.nome,
        valor: valorNum,
        vencimento,
        numero_documento: numeroDoc,
        banco,
        multa: parseValor(multa),
        juros: parseValor(juros),
        instrucoes,
        pagador,
      });
      navigate(`/documento/${data.id}`);
    } catch {
      alert("Erro ao gerar boleto.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="px-9 pt-[30px] pb-[60px] grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-[26px] items-start">
      <div className="flex flex-col gap-5">
        {/* 1 - Pagador */}
        <Card>
          <StepHeader n={1} title="Pagador" />
          <div className="bg-[#F2FBF8] border border-[#CFEDE5] rounded-xl px-4 py-3.5 mb-[18px]">
            <label className="flex items-center gap-2 text-[11.5px] font-bold tracking-[0.04em] uppercase text-brand-dark mb-2">
              <FiUsers size={16} /> Cobrar de cliente cadastrado
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
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field className="sm:col-span-2" label="Nome / Razão social" value={pagador.nome || ""} onChange={(v) => setP("nome", v)} />
            <Field label="CNPJ / CPF" value={pagador.doc || ""} onChange={(v) => setP("doc", v)} mono />
            <Field className="sm:col-span-3" label="Endereço completo" value={pagador.endereco || ""} onChange={(v) => setP("endereco", v)} />
          </div>
        </Card>

        {/* 2 - Dados do boleto */}
        <Card>
          <StepHeader n={2} title="Dados do boleto" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Valor do documento" value={valor} onChange={setValor} mono />
            <Field label="Vencimento" value={vencimento} onChange={setVencimento} mono />
            <Field label="Nº do documento" value={numeroDoc} onChange={setNumeroDoc} mono />
            <div>
              <label className="block text-[12.5px] font-semibold text-[#5A6A63] mb-1.5">Banco</label>
              <select
                value={banco}
                onChange={(e) => setBanco(e.target.value)}
                className="w-full h-[42px] border-[1.5px] border-[#E2E8E6] rounded-[10px] px-3 text-[13.5px] bg-white outline-none focus:border-brand"
              >
                <option>001 — Banco do Brasil</option>
                <option>237 — Bradesco</option>
                <option>341 — Itaú</option>
              </select>
            </div>
            <Field label="Carteira" value="17 — Registrada" />
            <Field label="Espécie" value="DS — Duplicata de Serviço" />
          </div>
        </Card>

        {/* 3 - Juros/multa */}
        <Card>
          <StepHeader n={3} title="Juros, multa e instruções" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Multa por atraso (%)" value={multa} onChange={setMulta} mono />
            <Field label="Juros ao mês (%)" value={juros} onChange={setJuros} mono />
            <Field label="Desconto até venc." value="0,00" mono />
            <div className="sm:col-span-3">
              <label className="block text-[12.5px] font-semibold text-[#5A6A63] mb-1.5">Instruções ao caixa</label>
              <textarea
                value={instrucoes}
                onChange={(e) => setInstrucoes(e.target.value)}
                className="w-full h-[70px] border-[1.5px] border-[#E2E8E6] rounded-[10px] p-3 text-[13.5px] resize-y outline-none focus:border-brand leading-relaxed"
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="lg:sticky lg:top-[104px] flex flex-col gap-4">
        <ResumoBox
          titulo="Resumo do boleto"
          linhas={[
            { label: "Valor do documento", valor: fmtBRL(valorNum) },
            { label: "Vencimento", valor: vencimento },
            { label: "Banco", valor: banco.split(" — ")[0] },
          ]}
          totalLabel="Total a cobrar"
          totalValor={fmtBRL(valorNum)}
        />
        <PrimaryButton onClick={gerar} disabled={enviando || !cliente} className="w-full">
          <FiCreditCard size={18} />
          {enviando ? "Gerando…" : "Gerar boleto registrado"}
        </PrimaryButton>
        <button className="w-full h-11 bg-white text-[#34433D] border-[1.5px] border-[#E2E8E6] rounded-xl text-sm font-semibold hover:border-brand hover:text-brand-dark">
          Salvar rascunho
        </button>
      </div>
    </div>
  );
};
