import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  FiFileText,
  FiCreditCard,
  FiLayers,
  FiUsers,
  FiClock,
  FiEye,
  FiSearch,
  FiBell,
  FiLogOut,
} from "react-icons/fi";
import logo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";
import { iniciais } from "../utils/format";

const TITULOS: Record<string, { title: string; subtitle: string }> = {
  "/nota-fiscal": {
    title: "Emitir Nota Fiscal de Serviço",
    subtitle: "NFS-e · Padrão ABRASF 2.01 · Prefeitura de Bauru",
  },
  "/boleto": {
    title: "Gerar Boleto",
    subtitle: "Cobrança registrada · Banco do Brasil",
  },
  "/lote": {
    title: "Emissão em lote",
    subtitle: "Gere notas e boletos para vários clientes de uma vez",
  },
  "/clientes": { title: "Clientes", subtitle: "Cadastros ativos" },
  "/historico": {
    title: "Histórico de documentos",
    subtitle: "Documentos emitidos",
  },
  "/documento": {
    title: "Visualização do documento",
    subtitle: "Pré-visualização da NFS-e / boleto",
  },
};

const NAV = [
  { secao: "Emitir", itens: [
    { to: "/nota-fiscal", label: "Nota Fiscal", icon: FiFileText },
    { to: "/boleto", label: "Boleto", icon: FiCreditCard },
    { to: "/lote", label: "Emissão em lote", icon: FiLayers },
  ]},
  { secao: "Gerenciar", itens: [
    { to: "/clientes", label: "Clientes", icon: FiUsers },
    { to: "/historico", label: "Histórico", icon: FiClock },
    { to: "/documento", label: "Documentos", icon: FiEye },
  ]},
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const matched = Object.keys(TITULOS).find((k) =>
    location.pathname.startsWith(k)
  );
  const head = (matched && TITULOS[matched]) || {
    title: "Sistema Fiscal Alvorada",
    subtitle: "",
  };

  function sair() {
    logout();
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen">
      {/* SIDEBAR */}
      <aside className="w-[258px] flex-none flex flex-col px-4 py-[22px] sticky top-0 h-screen bg-gradient-to-b from-[#0A1613] to-[#06100D]">
        <div className="flex items-center gap-3 px-2 pb-[22px] pt-1.5">
          <img src={logo} alt="Alvorada" className="w-10 h-10 rounded-[10px] object-cover" />
          <div className="text-white font-sora font-bold text-sm leading-tight">
            Alvorada
            <br />
            <span className="text-brand-mint font-semibold text-xs">Contabilidade</span>
          </div>
        </div>

        {NAV.map((grupo) => (
          <div key={grupo.secao}>
            <div className="text-[11px] font-bold tracking-[0.1em] text-[#4D635C] uppercase px-2.5 pt-[22px] pb-2">
              {grupo.secao}
            </div>
            {grupo.itens.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-[11px] rounded-[11px] text-sm font-semibold mb-1 transition-colors ${
                    isActive
                      ? "bg-brand-mint text-[#06100D]"
                      : "text-[#9FB4AD] hover:bg-white/5"
                  }`
                }
              >
                <Icon size={19} />
                {label}
              </NavLink>
            ))}
          </div>
        ))}

        <div className="mt-auto bg-[#101e1a] rounded-[14px] p-3.5 flex items-center gap-3">
          <div className="w-[38px] h-[38px] rounded-[10px] bg-brand-mint text-[#06100D] flex items-center justify-center font-sora font-bold text-sm flex-none">
            {iniciais(user?.nome || "Alvorada")}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-white text-[13.5px] font-semibold truncate">
              {user?.nome || "Usuário"}
            </div>
            <div className="text-[#5F756E] text-[11.5px] truncate">
              {user?.cargo || "Contador"}
            </div>
          </div>
          <button onClick={sair} title="Sair" className="flex-none text-[#5F756E] hover:text-white">
            <FiLogOut size={17} />
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="scrl flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="sticky top-0 z-[5] bg-cloud/85 backdrop-blur border-b border-[#E7ECEA] px-9 py-5 flex items-center justify-between">
          <div>
            <h1 className="font-sora text-[22px] font-bold tracking-tight m-0">
              {head.title}
            </h1>
            <div className="text-[#7A8A84] text-[13.5px] mt-0.5">{head.subtitle}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-3 text-[#9AA8A2]" size={17} />
              <input
                placeholder="Buscar cliente, nº da nota..."
                className="w-[262px] h-10 border border-[#E2E8E6] rounded-[11px] pl-[38px] pr-3.5 text-[13.5px] bg-white outline-none focus:border-brand"
              />
            </div>
            <button className="w-10 h-10 rounded-[11px] border border-[#E2E8E6] bg-white flex items-center justify-center relative">
              <FiBell size={18} className="text-[#34433D]" />
              <span className="absolute top-[9px] right-[10px] w-[7px] h-[7px] rounded-full bg-brand border-[1.5px] border-white" />
            </button>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
};
