import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheck } from "react-icons/fi";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";

export const AuthPage = () => {
  const [email, setEmail] = useState("contador@alvoradacontabil.com.br");
  const [password, setPassword] = useState("123456789");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { loginIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Entrar · Sistema Fiscal Alvorada";
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      loginIn({ ...res.data.user, token: res.data.token });
      navigate("/historico");
    } catch (err: any) {
      setError(
        err?.response?.data?.errors?.[0] || "Não foi possível entrar. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Painel escuro */}
      <div className="flex-1 bg-black flex-col justify-between p-[56px_60px] relative overflow-hidden hidden md:flex">
        <div className="absolute -top-[120px] -right-[120px] w-[360px] h-[360px] rounded-full bg-[radial-gradient(circle,rgba(22,224,189,0.18),transparent_70%)]" />
        <div className="flex items-center gap-3 relative">
          <img src={logo} alt="Alvorada" className="w-[46px] h-[46px] rounded-[11px] object-cover" />
          <div className="text-white font-sora font-bold text-[15px] leading-tight">
            Alvorada
            <br />
            <span className="text-brand-mint font-semibold">Contabilidade</span>
          </div>
        </div>
        <div className="relative">
          <img
            src={logo}
            alt=""
            className="w-[150px] h-[150px] rounded-3xl object-cover mb-[34px] shadow-[0_24px_60px_rgba(22,224,189,0.18)]"
          />
          <h1 className="font-sora text-white text-[38px] leading-[1.1] font-bold m-0 mb-[18px] tracking-tight max-w-[460px]">
            Emita notas fiscais e boletos em um só lugar.
          </h1>
          <p className="text-[#8FA39C] text-base leading-relaxed m-0 max-w-[430px]">
            Plataforma interna do Escritório Alvorada para gerar NFS-e padrão
            ABRASF e boletos registrados dos seus clientes.
          </p>
        </div>
        <div className="flex gap-[26px] relative">
          <Stat valor="4.903" label="NFS-e emitidas" />
          <div className="w-px bg-[#1d2826]" />
          <Stat valor="312" label="clientes ativos" />
          <div className="w-px bg-[#1d2826]" />
          <Stat valor="(14) 3296-1403" label="suporte" />
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-10 bg-white">
        <form onSubmit={handleSubmit} className="w-full max-w-[380px]">
          <div className="text-[13px] font-bold tracking-[0.08em] text-[#0FB99A] uppercase mb-2.5">
            Acesso interno
          </div>
          <h2 className="font-sora text-[27px] font-bold m-0 mb-1.5 tracking-tight">
            Bem-vindo de volta
          </h2>
          <p className="text-[#6B7B75] text-[14.5px] m-0 mb-[30px]">
            Entre com suas credenciais do escritório.
          </p>

          <label className="block text-[13px] font-semibold text-[#34433D] mb-[7px]">
            E-mail
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-[46px] border-[1.5px] border-[#E2E8E6] rounded-[11px] px-3.5 text-[14.5px] mb-[18px] bg-white outline-none focus:border-brand"
          />

          <label className="block text-[13px] font-semibold text-[#34433D] mb-[7px]">
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-[46px] border-[1.5px] border-[#E2E8E6] rounded-[11px] px-3.5 text-[14.5px] mb-3.5 bg-white outline-none focus:border-brand"
          />

          <div className="flex items-center justify-between mb-[26px]">
            <label className="flex items-center gap-2 text-[13.5px] text-[#4A5A53] cursor-pointer">
              <span className="w-[18px] h-[18px] rounded-md bg-brand inline-flex items-center justify-center text-white">
                <FiCheck size={11} strokeWidth={3.5} />
              </span>
              Manter conectado
            </label>
            <span className="text-[13.5px] text-brand font-semibold cursor-pointer">
              Esqueci a senha
            </span>
          </div>

          {error && (
            <div className="mb-3 text-[13px] text-[#C0392B] bg-[#FBE6E3] border border-[#f3c9c2] rounded-[10px] px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-brand text-white border-none rounded-[11px] text-[15px] font-bold cursor-pointer tracking-tight shadow-[0_8px_20px_rgba(15,185,154,0.28)] hover:bg-brand-dark disabled:opacity-70"
          >
            {loading ? "Entrando…" : "Entrar no sistema"}
          </button>

          <p className="text-center text-[#9AA8A2] text-[12.5px] mt-7">
            Escritório Alvorada Contabilidade · CNPJ 20.843.290/0001-42
          </p>
        </form>
      </div>
    </div>
  );
};

function Stat({ valor, label }: { valor: string; label: string }) {
  return (
    <div>
      <div className="font-sora text-brand-mint text-2xl font-bold">{valor}</div>
      <div className="text-[#6F837C] text-[12.5px]">{label}</div>
    </div>
  );
}
