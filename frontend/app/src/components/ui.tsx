import React from "react";

/** Cartão branco padrão das telas. */
export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-[#E7ECEA] rounded-2xl p-6 ${className}`}
    >
      {children}
    </div>
  );
}

/** Cabeçalho numerado de seção (1, 2, 3...). */
export function StepHeader({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-7 h-7 rounded-lg bg-[#E6F7F3] flex items-center justify-center font-sora font-bold text-brand-dark text-sm">
        {n}
      </div>
      <h3 className="font-sora text-base font-bold m-0 tracking-tight">{title}</h3>
    </div>
  );
}

/** Campo de formulário rotulado. */
export function Field({
  label,
  value,
  onChange,
  mono,
  placeholder,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  mono?: boolean;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-[12.5px] font-semibold text-[#5A6A63] mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={!onChange}
        className={`w-full h-[42px] border-[1.5px] border-[#E2E8E6] rounded-[10px] px-3 text-[13.5px] outline-none focus:border-brand ${
          mono ? "font-mono" : ""
        } ${!onChange ? "bg-cloud" : ""}`}
      />
    </div>
  );
}

/** Botão primário (verde). */
export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`h-12 bg-brand text-white border-none rounded-xl text-[14.5px] font-bold cursor-pointer flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(15,185,154,0.26)] hover:bg-brand-dark disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

/** Painel escuro de resumo (sticky à direita). */
export function ResumoBox({
  titulo,
  linhas,
  totalLabel,
  totalValor,
}: {
  titulo: string;
  linhas: { label: string; valor: string }[];
  totalLabel: string;
  totalValor: string;
}) {
  return (
    <div className="bg-panel rounded-2xl p-6 text-white">
      <div className="text-xs font-bold tracking-[0.08em] uppercase text-[#5FE9CF] mb-[18px]">
        {titulo}
      </div>
      {linhas.map((l) => (
        <div
          key={l.label}
          className="flex justify-between text-[13.5px] text-[#9FB4AD] mb-[11px]"
        >
          <span>{l.label}</span>
          <span className="font-mono text-white">{l.valor}</span>
        </div>
      ))}
      <div className="h-px bg-[#1d2826] my-3.5" />
      <div className="flex justify-between items-end">
        <span className="text-[13.5px] text-[#9FB4AD]">{totalLabel}</span>
        <span className="font-sora text-[26px] font-bold text-brand-mint">
          {totalValor}
        </span>
      </div>
    </div>
  );
}

/** Selo de status colorido. */
export function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, { bg: string; cor: string }> = {
    Autorizada: { bg: "#E6F7F3", cor: "#0FB99A" },
    Pago: { bg: "#E6F7F3", cor: "#0FB99A" },
    "Em aberto": { bg: "#FBF2DC", cor: "#C98A0E" },
    Vencido: { bg: "#FBE6E3", cor: "#C0392B" },
    Cancelada: { bg: "#EEF1F0", cor: "#7A8A84" },
    Rascunho: { bg: "#EEF1F0", cor: "#7A8A84" },
  };
  const c = map[status || ""] || { bg: "#EEF1F0", cor: "#5A6A63" };
  return (
    <span
      className="text-[11.5px] font-bold px-2.5 py-1 rounded-full"
      style={{ background: c.bg, color: c.cor }}
    >
      {status}
    </span>
  );
}
