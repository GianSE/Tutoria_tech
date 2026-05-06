import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import PrivateRoute from "./components/PrivateRoute";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UsuariosPage from "./pages/UsuariosPage";
import TutoriasPage from "./pages/TutoriasPage";
import MateriaisPage from "./pages/MateriaisPage";
import AgendaPage from "./pages/AgendaPage";
import PerfilPage from "./pages/PerfilPage";
import ConfiguracoesIAPage from "./pages/ConfiguracoesIAPage";
import ConfiguracoesPaginas from "./pages/ConfiguracoesPaginas";


export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />

          {/* ── Rotas privadas para TODOS os papéis ──────────────────────── */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />

              <Route path="/materiais" element={<MateriaisPage />} />
              <Route path="/agenda"    element={<AgendaPage />} />
              <Route path="/perfil"    element={<PerfilPage />} />

              {/* ── Rotas comuns ───────────────────────────────────────── */}
              <Route path="/tutorias"  element={<TutoriasPage />} />

              {/* ── Apenas ADMIN ───────────────────────────────────────── */}
              <Route element={<PrivateRoute allowedRoles={["ADMIN"]} />}>
                <Route path="/usuarios" element={<UsuariosPage />} />
                <Route path="/configuracoes-ia" element={<ConfiguracoesIAPage />} />
                <Route path="/configuracoes-paginas" element={<ConfiguracoesPaginas />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ChatProvider>
    </AuthProvider>
  );
}
