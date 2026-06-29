import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheckCircle, FiUsers } from "react-icons/fi";
import api from "../../api/api";
import { Cliente } from "../../types";
import { Card, StepHeader, Field, PrimaryButton, ResumoBox } from "../../components/ui";
import { AmbienteCertificado, Ambiente } from "../../components/AmbienteCertificado";
import { SenhaCertificadoModal } from "../../components/SenhaCertificadoModal";
import { CompletarNfseModal } from "../../components/CompletarNfseModal";
import { camposNfseFaltantes } from "../../utils/nfse";
import { fmtBRL, parseValor } from "../../utils/format";

export const NotaFiscal = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [idx, setIdx] = useState(0);
  const [edits, setEdits] = useState<Partial<Cliente>>({});
  const [ambiente, setAmbiente] = useState<Ambiente>("homologacao");
  const [valor, setValor] = useState("98,00");
  const [aliquota, setAliquota] = useState("5,00");
  const [discriminacao, setDiscriminacao] = useState(
    "Serviços de passagem de cabo de rede"
  );
  const [itemLista, setItemLista] = useState("14.02");
  const [cnae, setCnae] = useState("6209100");
  const [codTributacao, setCodTributacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [senhaModal, setSenhaModal] = useState(false);
  const [completarCliente, setCompletarCliente] = useState<Cliente | null>(null);

  useEffect(() => {
    api
      .get("/clientes")
      .then((r) => {
        setClientes(r.data);
        if (r.data?.[0]) aplicarPadroesCliente(r.data[0]);
      })
      .catch(() => {});
    // Ambiente padrão continua vindo de Configurações.
    api
      .get("/configuracoes")
      .then((r) => {
        const c = r.data?.nfse;
        if (!c) return;
        setAmbiente(c.ambiente === "producao" ? "producao" : "homologacao");
      })
      .catch(() => {});
  }, []);

  // Pré-preenche os campos de serviço/tributação a partir do cliente selecionado.
  // Mantém o valor atual quando o cliente não tem o padrão cadastrado.
  function aplicarPadroesCliente(c?: Cliente) {
    if (!c) return;
    if (c.item_lista) setItemLista(c.item_lista);
    if (c.cnae) setCnae(c.cnae);
    if (c.cod_tributacao_municipio) setCodTributacao(c.cod_tributacao_municipio);
    if (c.aliquota) setAliquota(c.aliquota);
    if (c.discriminacao) setDiscriminacao(c.discriminacao);
  }

  const cliente = clientes[idx];
  const tomador = { ...cliente, ...edits } as Cliente;
  const optanteSimples = /simples/i.test(String(cliente?.regime || ""));

  const valorNum = parseValor(valor);
  const aliqNum = parseValor(aliquota);
  const iss = useMemo(() => +(valorNum * (aliqNum / 100)).toFixed(2), [valorNum, aliqNum]);

  function setT(campo: keyof Cliente, v: string) {
    setEdits((e) => ({ ...e, [campo]: v }));
  }

  // Antes de emitir, exige que o cliente tenha os dados de NFS-e no cadastro.
  function iniciarEmissao() {
    if (!cliente) return;
    if (camposNfseFaltantes(cliente).length) {
      setCompletarCliente(cliente);
      return;
    }
    setSenhaModal(true);
  }

  // Após completar o cadastro no popup, atualiza o cliente e segue p/ a emissão.
  function aoCompletarCliente(c: Cliente) {
    setClientes((arr) => arr.map((x) => (x.id === c.id ? c : x)));
    aplicarPadroesCliente(c);
    setCompletarCliente(null);
    setSenhaModal(true);
  }

  async function emitir(certPassword: string) {
    if (!cliente) return;
    setEnviando(true);
    try {
      const { data } = await api.post("/documentos/nfse", {
        ambiente,
        cliente_id: cliente.id,
        cliente_nome: tomador.nome,
        valor: valorNum,
        aliquota: aliqNum,
        discriminacao,
        item_lista: itemLista,
        cnae,
        cod_tributacao_municipio: codTributacao,
        optanteSimples,
        tomador,
        certPassword,
      });
      setSenhaModal(false);
      if (data.enviado && data.autorizada === false) {
        alert(`A prefeitura REJEITOU a NFS-e:\n\n${data.aviso || "Verifique o retorno do webservice."}`);
      } else if (data.aviso) {
        alert(`NFS-e não transmitida (RPS montado):\n\n${data.aviso}`);
      } else if (data.autorizada) {
        alert(`NFS-e autorizada pela prefeitura! Número: ${data.numero}`);
      }
      navigate(`/documento/${data.id}`);
    } catch (err: any) {
      alert(err?.response?.data?.errors?.[0] || "Erro ao emitir NFS-e.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="px-9 pt-[30px] pb-[60px] grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-[26px] items-start">
      <div className="flex flex-col gap-5">
        {/* Ambiente + certificado */}
        <AmbienteCertificado ambiente={ambiente} setAmbiente={setAmbiente} />

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
                const i = +e.target.value;
                setIdx(i);
                setEdits({});
                aplicarPadroesCliente(clientes[i]);
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

        {/* 2 - Valores */}
        <Card>
          <StepHeader n={2} title="Valores e tributos" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Field label="Valor do serviço" value={valor} onChange={setValor} mono />
            <Field label="Deduções" value="0,00" mono />
            <Field label="Alíquota ISS (%)" value={aliquota} onChange={setAliquota} mono />
            <Field label="Valor ISS" value={fmtBRL(iss)} mono />
          </div>
          <div className="flex items-center gap-2.5 mt-4 text-[13.5px] text-[#34433D]">
            <span
              className="w-[18px] h-[18px] rounded-md inline-flex items-center justify-center text-white flex-none"
              style={{ background: optanteSimples ? "#0FB99A" : "#CBD5D1" }}
            >
              {optanteSimples && <FiCheckCircle size={12} />}
            </span>
            {optanteSimples
              ? "Optante pelo Simples Nacional"
              : "Não optante pelo Simples Nacional"}
            <span className="text-[12px] text-[#9AA8A2]">(definido pelo regime do cliente)</span>
          </div>
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
        <PrimaryButton
          onClick={iniciarEmissao}
          disabled={enviando || !cliente}
          className="w-full"
        >
          <FiCheckCircle size={18} />
          {enviando
            ? "Emitindo…"
            : `Emitir NFS-e (${ambiente === "producao" ? "Produção" : "Homologação"})`}
        </PrimaryButton>
        <button className="w-full h-11 bg-white text-[#34433D] border-[1.5px] border-[#E2E8E6] rounded-xl text-sm font-semibold hover:border-brand hover:text-brand-dark">
          Salvar rascunho
        </button>
      </div>

      <SenhaCertificadoModal
        aberto={senhaModal}
        ambiente={ambiente}
        enviando={enviando}
        onCancelar={() => setSenhaModal(false)}
        onConfirmar={(senha) => emitir(senha)}
      />

      <CompletarNfseModal
        cliente={completarCliente}
        onFechar={() => setCompletarCliente(null)}
        onSalvo={aoCompletarCliente}
      />
    </div>
  );
};
