import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { AuthPage } from "./pages/auth/AuthPage";
import { NotaFiscal } from "./pages/notafiscal/NotaFiscal";
import { Boleto } from "./pages/boleto/Boleto";
import { EmissaoLote } from "./pages/lote/EmissaoLote";
import { Clientes } from "./pages/clientes/Clientes";
import { Historico } from "./pages/historico/Historico";
import { Preview } from "./pages/preview/Preview";
import { Usuarios } from "./pages/usuarios/Usuarios";

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-cloud text-[#6B7B75]">
        Carregando…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />

        <Route element={<ProtectedRoutes />}>
          <Route path="/" element={<Navigate to="/historico" replace />} />
          <Route path="/nota-fiscal" element={<NotaFiscal />} />
          <Route path="/boleto" element={<Boleto />} />
          <Route path="/lote" element={<EmissaoLote />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/documento/:id" element={<Preview />} />
          <Route path="/documento" element={<Preview />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
