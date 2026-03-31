import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UsuariosPage from "./pages/UsuariosPage";
import TutoriasPage from "./pages/TutoriasPage";
import MateriaisPage from "./pages/MateriaisPage";
import AgendaPage from "./pages/AgendaPage";
import PerfilPage from "./pages/PerfilPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />

        {/* ── Rotas privadas para TODOS os papéis ──────────────────────── */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/app/dashboard" element={<DashboardPage />} />
            <Route path="/app/materiais" element={<MateriaisPage />} />
            <Route path="/app/agenda"    element={<AgendaPage />} />
            <Route path="/app/perfil"    element={<PerfilPage />} />

            {/* ── Apenas ADMIN e MENTORA ─────────────────────────────── */}
            <Route element={<PrivateRoute allowedRoles={["ADMIN", "MENTORA"]} />}>
              <Route path="/app/tutorias" element={<TutoriasPage />} />
            </Route>

            {/* ── Apenas ADMIN ───────────────────────────────────────── */}
            <Route element={<PrivateRoute allowedRoles={["ADMIN"]} />}>
              <Route path="/app/usuarios" element={<UsuariosPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
