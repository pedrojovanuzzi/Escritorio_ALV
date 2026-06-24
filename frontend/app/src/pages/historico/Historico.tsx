import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye } from "react-icons/fi";
import api from "../../api/api";
import { Documento, Estatisticas } from "../../types";
import { fmtBRL } from "../../utils/format";
import { StatusBadge } from "../../components/ui";

export const Historico = () => {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<Documento[]>([]);
  const [stats, setStats] = useState<Estatisticas | null>(null);

  useEffect(() => {
    api.get("/documentos").then((r) => setDocs(r.data)).catch(() => {});
    api.get("/documentos/estatisticas").then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const cards = [
    { label: "NFS-e emitidas", valor: String(stats?.nfse_emitidas ?? 0), sub: "total" },
    { label: "Boletos gerados", valor: String(stats?.boletos_gerados ?? 0), sub: "total" },
    { label: "Valor faturado", valor: fmtBRL(stats?.valor_faturado ?? 0), sub: "acumulado" },
    {
      label: "Em aberto",
      valor: fmtBRL(stats?.em_aberto ?? 0),
      sub: `${stats?.em_aberto_qtd ?? 0} boletos`,
      destaque: true,
    },
  ];

  return (
    <div className="px-9 pt-[26px] pb-[60px]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-[22px]">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-[#E7ECEA] rounded-[14px] px-5 py-[18px]">
            <div className="text-[12.5px] text-[#7A8A84] font-semibold mb-2">{c.label}</div>
            <div
              className="font-sora text-[25px] font-bold"
              style={{ color: c.destaque ? "#C98A0E" : "#122019" }}
            >
              {c.valor}
            </div>
            <div className="text-xs text-[#7A8A84] font-semibold mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#E7ECEA] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[0.9fr_0.9fr_1.8fr_1fr_1fr_1fr_0.7fr] px-[22px] py-3.5 border-b border-[#EEF2F0] text-[11.5px] font-bold tracking-[0.06em] uppercase text-[#9AA8A2]">
          <div>Tipo</div>
          <div>Número</div>
          <div>Cliente</div>
          <div>Valor</div>
          <div>Data</div>
          <div>Status</div>
          <div className="text-right" />
        </div>
        {docs.map((d) => (
          <div
            key={d.id}
            className="grid grid-cols-[0.9fr_0.9fr_1.8fr_1fr_1fr_1fr_0.7fr] px-[22px] py-[15px] border-b border-[#F2F5F4] items-center hover:bg-[#F8FBFA]"
          >
            <div>
              <span className="text-[11.5px] font-bold px-2.5 py-1 rounded-md bg-panel text-brand-mint">
                {d.tipo === "NFSE" ? "NFS-e" : "Boleto"}
              </span>
            </div>
            <div className="text-[13px] font-mono text-[#34433D]">{d.numero}</div>
            <div className="text-[13.5px] font-semibold text-ink truncate">{d.cliente_nome}</div>
            <div className="text-[13.5px] font-mono text-ink">{fmtBRL(Number(d.valor))}</div>
            <div className="text-[13px] text-[#5A6A63] font-mono">
              {d.criado_em ? new Date(d.criado_em).toLocaleDateString("pt-BR") : "—"}
            </div>
            <div>
              <StatusBadge status={d.status} />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => navigate(`/documento/${d.id}`)}
                className="w-8 h-8 rounded-lg border border-[#E2E8E6] bg-white flex items-center justify-center hover:border-brand"
              >
                <FiEye size={15} className="text-brand-dark" />
              </button>
            </div>
          </div>
        ))}
        {docs.length === 0 && (
          <div className="px-[22px] py-10 text-center text-[#9AA8A2] text-sm">
            Nenhum documento emitido ainda. Gere uma NFS-e ou boleto para começar.
          </div>
        )}
      </div>
    </div>
  );
};
