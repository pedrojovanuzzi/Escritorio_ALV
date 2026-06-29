import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheck, FiFileText, FiCreditCard, FiLayers, FiCheckCircle, FiAlertTriangle, FiX } from "react-icons/fi";
import api from "../../api/api";
import { Cliente } from "../../types";
import { fmtBRL, iniciais } from "../../utils/format";
import { Card, PrimaryButton } from "../../components/ui";
import { EditarNfseLoteModal } from "../../components/EditarNfseLoteModal";
import { camposNfseFaltantes } from "../../utils/nfse";

type Tipo = "NFSE" | "BOLETO";

export const EmissaoLote = () => {
  const navigate = useNavigate();
  const [tipo, setTipo] = useState<Tipo>("NFSE");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [sel, setSel] = useState<Record<number, boolean>>({});
  const [valores, setValores] = useState<Record<number, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ gerados: number; valor_total: number } | null>(null);
  // Clientes selecionados sem dados de NFS-e (dispara o popup de completar).
  const [incompletos, setIncompletos] = useState<Cliente[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);

  function carregar(manterSelecao = false) {
    return api.get("/clientes").then((r) => {
      const cs: Cliente[] = r.data;
      setClientes(cs);
      if (manterSelecao) return;
      const s: Record<number, boolean> = {};
      const v: Record<number, number> = {};
      cs.forEach((c, i) => {
        s[c.id!] = true;
        v[c.id!] = 90 + ((i * 43) % 760);
      });
      setSel(s);
      setValores(v);
    });
  }
  useEffect(() => {
    carregar();
  }, []);

  const selecionados = clientes.filter((c) => sel[c.id!]);
  const total = useMemo(
    () => selecionados.reduce((a, c) => a + (valores[c.id!] || 0), 0),
    [selecionados, valores]
  );
  const todosMarcados = clientes.length > 0 && clientes.every((c) => sel[c.id!]);

  function toggle(id: number) {
    setSel((s) => ({ ...s, [id]: !s[id] }));
  }
  function toggleTodos() {
    const novo = !todosMarcados;
    const s: Record<number, boolean> = {};
    clientes.forEach((c) => (s[c.id!] = novo));
    setSel(s);
  }

  async function gerar() {
    // NFS-e exige os dados fiscais no cadastro de cada cliente selecionado.
    if (tipo === "NFSE") {
      const faltando = selecionados.filter((c) => camposNfseFaltantes(c).length);
      if (faltando.length) {
        setIncompletos(faltando);
        return;
      }
    }
    setEnviando(true);
    try {
      const itens = selecionados.map((c) => ({
        cliente_id: c.id,
        cliente_nome: c.nome,
        valor: valores[c.id!] || 0,
      }));
      const { data } = await api.post("/documentos/lote", { tipo, itens });
      setResultado({ gerados: data.gerados, valor_total: data.valor_total });
    } catch (e: any) {
      // O backend também valida e devolve 422 com a lista de incompletos.
      if (e?.response?.status === 422 && Array.isArray(e.response.data?.incompletos)) {
        const ids = new Set(e.response.data.incompletos.map((x: any) => x.cliente_id));
        setIncompletos(clientes.filter((c) => ids.has(c.id)));
      } else {
        alert("Erro na emissão em lote.");
      }
    } finally {
      setEnviando(false);
    }
  }

  // Recarrega os clientes após preencher em massa e fecha os popups.
  async function aoPreencherEmMassa() {
    await carregar(true);
    setBulkOpen(false);
    setIncompletos([]);
  }

  const docWord = tipo === "NFSE" ? "NFS-e" : "boletos";

  if (resultado) {
    return (
      <div className="px-9 pt-6 pb-[60px]">
        <div className="max-w-[620px] mx-auto my-10 bg-white border border-[#E7ECEA] rounded-[18px] p-10 text-center">
          <div className="w-[72px] h-[72px] rounded-full bg-[#E6F7F3] flex items-center justify-center mx-auto mb-[22px]">
            <FiCheckCircle size={36} className="text-brand" />
          </div>
          <h2 className="font-sora text-2xl font-bold m-0 mb-2 tracking-tight">
            Lote processado com sucesso
          </h2>
          <p className="text-[#6B7B75] text-[15px] m-0 mb-[26px]">
            <strong className="text-brand-dark">{resultado.gerados}</strong>{" "}
            {docWord} foram gerados e enviados aos clientes selecionados.
          </p>
          <div className="flex gap-3.5 justify-center mb-[30px]">
            <Stat valor={String(resultado.gerados)} label="gerados" cor="#0FB99A" />
            <Stat valor={fmtBRL(resultado.valor_total)} label="valor total" />
            <Stat valor="0" label="com erro" />
          </div>
          <div className="flex gap-3 justify-center">
            <PrimaryButton onClick={() => navigate(tipo === "NFSE" ? "/notas" : "/boletos")} className="px-6">
              {tipo === "NFSE" ? "Ver notas geradas" : "Ver boletos gerados"}
            </PrimaryButton>
            <button
              onClick={() => setResultado(null)}
              className="h-[46px] px-6 rounded-xl border-[1.5px] border-[#E2E8E6] bg-white text-sm font-semibold text-[#34433D] hover:border-brand"
            >
              Nova emissão em lote
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-9 pt-6 pb-[60px]">
      <div className="flex bg-white border border-[#E2E8E6] rounded-[11px] p-1 gap-1 w-max mb-[22px]">
        <TabBtn ativo={tipo === "NFSE"} onClick={() => setTipo("NFSE")} icon={FiFileText} label="Notas Fiscais em lote" />
        <TabBtn ativo={tipo === "BOLETO"} onClick={() => setTipo("BOLETO")} icon={FiCreditCard} label="Boletos em lote" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-[26px] items-start">
        <div className="flex flex-col gap-5">
          <Card className="!p-[22px]">
            <h3 className="font-sora text-[15px] font-bold m-0 mb-4 tracking-tight">
              Parâmetros aplicados a todo o lote
            </h3>
            <p className="text-[13px] text-[#7A8A84] m-0">
              {tipo === "NFSE"
                ? "Item da lista, CNAE, alíquota, regime e discriminação vêm do cadastro de cada cliente. Clientes sem esses dados precisam ser completados antes de emitir."
                : "Vencimento, banco, carteira, multa e juros serão aplicados a cada boleto do lote."}
            </p>
          </Card>

          <div className="bg-white border border-[#E7ECEA] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-[22px] py-4 border-b border-[#EEF2F0]">
              <h3 className="font-sora text-[15px] font-bold m-0 tracking-tight">Clientes do lote</h3>
              <span className="text-xs text-[#9AA8A2]">{clientes.length} clientes disponíveis</span>
            </div>
            <div className="grid grid-cols-[44px_2.2fr_1.4fr_1.2fr_1fr] px-[22px] py-[11px] border-b border-[#EEF2F0] text-[11.5px] font-bold tracking-[0.05em] uppercase text-[#9AA8A2] items-center">
              <div
                onClick={toggleTodos}
                className="w-5 h-5 rounded-md border-2 cursor-pointer flex items-center justify-center"
                style={{
                  borderColor: todosMarcados ? "#0FB99A" : "#CBD5D1",
                  background: todosMarcados ? "#0FB99A" : "#fff",
                }}
              >
                {todosMarcados && <FiCheck size={12} className="text-white" strokeWidth={3.5} />}
              </div>
              <div>Cliente</div>
              <div>CPF / CNPJ</div>
              <div>Cidade</div>
              <div className="text-right">Valor</div>
            </div>
            <div className="scrl max-h-[420px] overflow-y-auto">
              {clientes.map((c) => {
                const marcado = !!sel[c.id!];
                return (
                  <div
                    key={c.id}
                    onClick={() => toggle(c.id!)}
                    className="grid grid-cols-[44px_2.2fr_1.4fr_1.2fr_1fr] px-[22px] py-3 border-b border-[#F2F5F4] items-center cursor-pointer"
                    style={{ background: marcado ? "#F4FCFA" : "#fff" }}
                  >
                    <div
                      className="w-5 h-5 rounded-md border-2 flex items-center justify-center"
                      style={{
                        borderColor: marcado ? "#0FB99A" : "#CBD5D1",
                        background: marcado ? "#0FB99A" : "#fff",
                      }}
                    >
                      {marcado && <FiCheck size={12} className="text-white" strokeWidth={3.5} />}
                    </div>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-panel text-brand-mint flex items-center justify-center font-sora font-bold text-[11px] flex-none">
                        {iniciais(c.nome)}
                      </div>
                      <div className="text-[13.5px] font-semibold truncate">{c.nome}</div>
                    </div>
                    <div className="text-[12.5px] font-mono text-[#34433D]">{c.doc}</div>
                    <div className="text-[13px] text-[#5A6A63]">{c.municipio}</div>
                    <div className="text-[13px] font-mono text-right text-ink font-medium">
                      {fmtBRL(valores[c.id!] || 0)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-[104px] flex flex-col gap-4">
          <div className="bg-panel rounded-2xl p-6 text-white">
            <div className="text-xs font-bold tracking-[0.08em] uppercase text-[#5FE9CF] mb-[18px]">
              Resumo do lote
            </div>
            <div className="flex justify-between items-baseline mb-3.5">
              <span className="text-[13.5px] text-[#9FB4AD]">Clientes selecionados</span>
              <span className="font-sora text-[22px] font-bold text-white">
                {selecionados.length}
                <span className="text-[13px] text-[#5F756E] font-medium"> / {clientes.length}</span>
              </span>
            </div>
            <div className="h-px bg-[#1d2826] my-3.5" />
            <div className="flex justify-between items-end">
              <span className="text-[13.5px] text-[#9FB4AD]">Valor total</span>
              <span className="font-sora text-2xl font-bold text-brand-mint">{fmtBRL(total)}</span>
            </div>
          </div>
          <PrimaryButton onClick={gerar} disabled={enviando || selecionados.length === 0} className="w-full !h-[50px]">
            <FiLayers size={19} />
            {enviando ? "Processando…" : `Gerar ${selecionados.length} ${docWord}`}
          </PrimaryButton>
          <div className="text-xs text-[#9AA8A2] text-center leading-relaxed">
            Os documentos serão emitidos e enviados por e-mail a cada cliente selecionado.
          </div>
        </div>
      </div>

      {/* Popup: clientes selecionados sem dados de NFS-e no cadastro */}
      {incompletos.length > 0 && !bulkOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-[560px] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-[#EEF2F0]">
              <h3 className="font-sora text-lg font-bold m-0 flex items-center gap-2 text-[#8A6D1E]">
                <FiAlertTriangle size={20} /> Dados de NFS-e faltando
              </h3>
              <button onClick={() => setIncompletos([])} className="text-[#9AA8A2] hover:text-ink">
                <FiX size={20} />
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto scrl">
              <p className="text-[13.5px] text-[#5A6A63] mt-0 mb-4">
                {incompletos.length} cliente(s) selecionado(s) não têm os dados de NFS-e no
                cadastro. Complete-os para emitir o lote.
              </p>
              <div className="flex flex-col gap-2.5">
                {incompletos.map((c) => (
                  <div key={c.id} className="border border-[#EEF2F0] rounded-[10px] px-3.5 py-2.5">
                    <div className="text-[13.5px] font-semibold text-ink">{c.nome}</div>
                    <div className="text-[12px] text-[#C0392B] mt-0.5">
                      Faltando: {camposNfseFaltantes(c).join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 pt-4 border-t border-[#EEF2F0]">
              <button
                onClick={() => setIncompletos([])}
                className="h-11 px-5 rounded-xl border-[1.5px] border-[#E2E8E6] bg-white text-sm font-semibold text-[#34433D] hover:border-brand"
              >
                Fechar
              </button>
              <PrimaryButton onClick={() => setBulkOpen(true)} className="px-6">
                <FiLayers size={17} /> Preencher em massa
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {bulkOpen && (
        <EditarNfseLoteModal
          clientes={incompletos}
          onFechar={() => setBulkOpen(false)}
          onSalvo={aoPreencherEmMassa}
        />
      )}
    </div>
  );
};

function TabBtn({
  ativo,
  onClick,
  icon: Icon,
  label,
}: {
  ativo: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-9 px-5 rounded-lg text-[13.5px] font-semibold flex items-center gap-2 ${
        ativo ? "bg-panel text-white" : "bg-transparent text-[#5A6A63]"
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  );
}

function Stat({ valor, label, cor = "#122019" }: { valor: string; label: string; cor?: string }) {
  return (
    <div className="bg-[#F7FAF9] border border-[#EAEFED] rounded-xl px-[26px] py-4 min-w-[130px]">
      <div className="font-sora text-2xl font-bold" style={{ color: cor }}>
        {valor}
      </div>
      <div className="text-[12.5px] text-[#7A8A84] mt-0.5">{label}</div>
    </div>
  );
}
