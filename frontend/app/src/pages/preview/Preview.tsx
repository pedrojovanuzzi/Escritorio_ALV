import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { FiPrinter, FiDownload } from "react-icons/fi";
import api from "../../api/api";
import { Documento } from "../../types";
import { fmtBRL } from "../../utils/format";
import logo from "../../assets/logo.png";

export const Preview = () => {
  const { id } = useParams();
  const [doc, setDoc] = useState<Documento | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      api.get(`/documentos/${id}`).then((r) => setDoc(r.data)).catch(() => {});
    } else {
      // Sem id: mostra o último documento emitido.
      api.get("/documentos").then((r) => setDoc(r.data[0] || null)).catch(() => {});
    }
  }, [id]);

  const print = useReactToPrint({ contentRef: ref });

  if (!doc) {
    return (
      <div className="px-9 py-16 text-center text-[#9AA8A2]">
        Nenhum documento para visualizar. Emita uma NFS-e ou boleto primeiro.
      </div>
    );
  }

  const d = doc.dados || {};
  const tomador = d.tomador || {};
  const pagador = d.pagador || {};

  return (
    <div className="px-9 pt-6 pb-[60px]">
      <div className="flex items-center justify-end gap-2.5 mb-5">
        <button
          onClick={print}
          className="h-10 px-4 rounded-[11px] border border-[#E2E8E6] bg-white text-[#34433D] text-[13.5px] font-semibold flex items-center gap-2 hover:border-brand"
        >
          <FiPrinter size={16} /> Imprimir
        </button>
        <button
          onClick={print}
          className="h-10 px-[18px] rounded-[11px] border-none bg-brand text-white text-[13.5px] font-bold flex items-center gap-2 shadow-[0_6px_16px_rgba(15,185,154,0.24)] hover:bg-brand-dark"
        >
          <FiDownload size={16} /> Baixar PDF
        </button>
      </div>

      <div ref={ref}>
        {doc.tipo === "NFSE" ? (
          <DocNfse doc={doc} d={d} tomador={tomador} />
        ) : (
          <DocBoleto doc={doc} d={d} pagador={pagador} />
        )}
      </div>
    </div>
  );
};

function DocNfse({ doc, d, tomador }: { doc: Documento; d: any; tomador: any }) {
  const valor = Number(doc.valor);
  const aliq = d.aliquota ?? 5;
  const iss = d.valor_iss ?? +(valor * (aliq / 100)).toFixed(2);
  const prest = d.prestador || {};
  const prestEnd = [prest.endereco, prest.numero].filter(Boolean).join(", ") +
    (prest.bairro ? ` — ${prest.bairro}` : "") +
    (prest.municipio ? `, ${prest.municipio}` : "") +
    (prest.uf ? `/${prest.uf}` : "");
  return (
    <div className="max-w-[820px] mx-auto bg-white border border-[#E2E8E6] rounded-lg shadow-[0_12px_40px_rgba(10,30,25,0.08)] overflow-hidden">
      <div className="bg-panel text-white px-[30px] py-[22px] flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <img src={logo} alt="" className="w-[50px] h-[50px] rounded-[10px] object-cover" />
          <div>
            <div className="font-sora font-bold text-[15px]">PREFEITURA MUNICIPAL DE BAURU</div>
            <div className="text-[#8FA39C] text-[12.5px] mt-0.5">
              Secretaria Municipal de Economia e Finanças
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[#5FE9CF] text-[11.5px] font-bold tracking-[0.06em]">NFS-e</div>
          <div className="text-[11px] text-[#8FA39C]">Nota Fiscal de Serviços Eletrônica</div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-[#EAEFED]">
        <InfoCell label="Número da NFS-e" valor={doc.numero} corValor="#0A9E84" mono />
        <InfoCell
          label="Número do RPS"
          valor={d.numero_rps ? `${d.numero_rps} / série ${d.serie_rps || "1"}` : "—"}
          mono
        />
        <InfoCell
          label="Data e hora de emissão"
          valor={doc.criado_em ? new Date(doc.criado_em).toLocaleString("pt-BR") : "—"}
          mono
        />
        <InfoCell label="Código de verificação" valor={doc.codigo_verificacao} mono semBorda />
      </div>

      <Bloco titulo="Prestador de serviços">
        <div className="grid grid-cols-[1.6fr_1fr] gap-y-1.5 gap-x-6 text-[13px] text-[#34433D] leading-relaxed">
          <div>
            <strong className="text-ink">{prest.razao_social || "—"}</strong>
            {prest.nome_fantasia ? ` · ${prest.nome_fantasia}` : ""}
          </div>
          <div>CNPJ: <span className="font-mono">{prest.cnpj}</span></div>
          <div>{prestEnd}</div>
          <div>Insc. Municipal: <span className="font-mono">{prest.inscricao_municipal || "—"}</span></div>
        </div>
      </Bloco>

      <Bloco titulo="Tomador de serviços">
        <div className="grid grid-cols-[1.6fr_1fr] gap-y-1.5 gap-x-6 text-[13px] text-[#34433D] leading-relaxed">
          <div><strong className="text-ink">{tomador.nome || doc.cliente_nome}</strong></div>
          <div>{tomador.tipo === "PF" ? "CPF" : "CNPJ"}: <span className="font-mono">{tomador.doc}</span></div>
          <div>{[tomador.endereco, tomador.numero].filter(Boolean).join(", ")}{tomador.bairro ? ` — ${tomador.bairro}` : ""}{tomador.municipio ? `, ${tomador.municipio}` : ""}</div>
          <div>{tomador.email}</div>
        </div>
      </Bloco>

      <Bloco titulo="Discriminação dos serviços">
        <div className="bg-[#F7FAF9] border border-[#EAEFED] rounded-lg px-4 py-3.5 text-[13px] text-[#34433D] leading-relaxed">
          {d.discriminacao} — {fmtBRL(valor)}
          <br />
          <span className="text-[#9AA8A2] text-xs">
            Item lista de serviço: {d.item_lista} · CNAE: {d.cnae} · Competência:{" "}
            {d.competencia || "06/2026"}
          </span>
        </div>
      </Bloco>

      <div className="grid grid-cols-4">
        <InfoCell label="Base de cálculo" valor={fmtBRL(valor)} mono />
        <InfoCell label="Alíquota" valor={`${aliq} %`} mono />
        <InfoCell label="Valor ISS" valor={fmtBRL(iss)} mono />
        <div className="px-[22px] py-4 bg-[#06100D]">
          <div className="text-[10.5px] font-bold text-[#5FE9CF] uppercase mb-1.5">Valor líquido</div>
          <div className="font-sora text-[17px] font-bold text-brand-mint">{fmtBRL(valor)}</div>
        </div>
      </div>
      <div className="px-[30px] py-3.5 bg-[#F7FAF9] text-[11.5px] text-[#9AA8A2] border-t border-[#EAEFED]">
        Optante pelo Simples Nacional · ISS não retido · Documento emitido por {prest.razao_social || "—"}.
      </div>
    </div>
  );
}

function DocBoleto({ doc, d, pagador }: { doc: Documento; d: any; pagador: any }) {
  const valor = Number(doc.valor);
  const linha = doc.linha_digitavel || d.linha_digitavel || "";
  const benef = d.beneficiario || {};
  const benefTexto = benef.razao_social
    ? `${benef.razao_social}${benef.cnpj ? ` · CNPJ ${benef.cnpj}` : ""}`
    : "—";
  return (
    <div className="max-w-[820px] mx-auto bg-white border border-[#E2E8E6] rounded-lg shadow-[0_12px_40px_rgba(10,30,25,0.08)] p-[30px] font-manrope">
      <div className="flex items-center justify-between border-b-2 border-panel pb-2.5 mb-1">
        <div className="flex items-center gap-3">
          <img src={logo} className="w-10 h-10 rounded-lg object-cover" alt="" />
          <span className="font-sora font-bold text-[17px]">001-9&nbsp; {d.banco || "Banco do Brasil"}</span>
        </div>
        <div className="font-mono text-[16px] font-semibold">{linha}</div>
      </div>
      <div className="text-[10.5px] text-[#9AA8A2] uppercase tracking-[0.05em] font-bold my-3.5">
        Ficha de compensação
      </div>

      <div className="border border-[#D7DFDC] rounded-md overflow-hidden">
        <div className="grid grid-cols-[1fr_200px] border-b border-[#E5EAE8]">
          <BoletoCell label="Beneficiário" valor={benefTexto} borda />
          <BoletoCell label="Vencimento" valor={d.vencimento || "—"} mono />
        </div>
        <div className="grid grid-cols-[1fr_1fr_200px] border-b border-[#E5EAE8]">
          <BoletoCell label="Nº documento" valor={d.numero_documento || doc.numero} mono borda />
          <BoletoCell label="Nosso número" valor={d.nosso_numero || "—"} mono borda />
          <div className="px-3.5 py-2.5 bg-[#F7FAF9]">
            <div className="text-[10px] text-[#9AA8A2] uppercase font-bold">(=) Valor do documento</div>
            <div className="text-[15px] font-mono font-semibold text-brand-dark mt-0.5">{fmtBRL(valor)}</div>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_200px]">
          <div className="px-3.5 py-2.5 border-r border-[#E5EAE8]">
            <div className="text-[10px] text-[#9AA8A2] uppercase font-bold">Pagador</div>
            <div className="text-[13px] text-ink mt-0.5">{pagador.nome || doc.cliente_nome} · {pagador.doc}</div>
            <div className="text-xs text-[#7A8A84] mt-0.5">{pagador.endereco}</div>
          </div>
          <BoletoCell label="Multa / Juros" valor={`Multa ${d.multa ?? 2}% · Juros ${d.juros ?? 1}% a.m.`} />
        </div>
      </div>

      <div className="px-3.5 py-3 mt-3 border border-[#D7DFDC] rounded-md">
        <div className="text-[10px] text-[#9AA8A2] uppercase font-bold">Instruções</div>
        <div className="text-[12.5px] text-[#34433D] mt-0.5 leading-relaxed">{d.instrucoes}</div>
      </div>

      {/* código de barras simulado */}
      <div className="flex items-end gap-px h-[54px] mt-5">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="h-full"
            style={{ width: `${(i % 5) + 1}px`, background: i % 2 ? "#fff" : "#0A1613" }}
          />
        ))}
      </div>
    </div>
  );
}

function InfoCell({
  label,
  valor,
  mono,
  corValor,
  semBorda,
}: {
  label: string;
  valor?: string;
  mono?: boolean;
  corValor?: string;
  semBorda?: boolean;
}) {
  return (
    <div className={`px-[22px] py-4 ${semBorda ? "" : "border-r border-[#EAEFED]"}`}>
      <div className="text-[10.5px] font-bold tracking-[0.05em] text-[#9AA8A2] uppercase mb-1.5">
        {label}
      </div>
      <div className={`text-sm ${mono ? "font-mono" : ""}`} style={{ color: corValor || "#122019" }}>
        {valor}
      </div>
    </div>
  );
}

function BoletoCell({ label, valor, mono, borda }: { label: string; valor?: string; mono?: boolean; borda?: boolean }) {
  return (
    <div className={`px-3.5 py-2.5 ${borda ? "border-r border-[#E5EAE8]" : ""}`}>
      <div className="text-[10px] text-[#9AA8A2] uppercase font-bold">{label}</div>
      <div className={`text-[13px] text-ink mt-0.5 ${mono ? "font-mono" : ""}`}>{valor}</div>
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="px-[30px] py-[18px] border-b border-[#EAEFED]">
      <div className="text-[11px] font-bold tracking-[0.06em] text-brand-dark uppercase mb-2.5">
        {titulo}
      </div>
      {children}
    </div>
  );
}
