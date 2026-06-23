import { useState, useEffect } from "react";
import { UserCircle2, Lock, Save, Loader2, AlertCircle, BookOpen, Users, TrendingUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { apiFetch } from "../lib/api";
import { useToast } from "../context/ToastContext";
import EmptyState from "../components/EmptyState";
import { useNavigate } from "react-router-dom";

const ROLE_LABELS = { ADMIN: "Administrador", MENTORA: "Mentora", ALUNA: "Aluna" };
const ROLE_STYLES = {
  ADMIN:   "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  MENTORA: "bg-blue-500/20   text-blue-400   border border-blue-500/30",
  ALUNA:   "bg-slate-600/40  text-slate-300  border border-slate-600/40",
};

const STAGE_LABELS = { INICIO: "Início", DESENVOLVENDO: "Desenvolvendo", AVANCADO: "Avançado", CONCLUIDO: "Concluído" };
const STAGE_TEXT   = { INICIO: "text-slate-400", DESENVOLVENDO: "text-sky-400", AVANCADO: "text-violet-400", CONCLUIDO: "text-emerald-400" };
const STAGE_BG     = { INICIO: "bg-slate-700", DESENVOLVENDO: "bg-sky-600", AVANCADO: "bg-violet-600", CONCLUIDO: "bg-emerald-600" };

const STATUS_TEAM_LABEL = {
  IDEACAO: "Ideação", PROTOTIPAGEM: "Prototipagem",
  EM_DESENVOLVIMENTO: "Em Desenvolvimento", CONCLUIDO: "Concluído",
};
const STATUS_TEAM_COLOR = {
  IDEACAO: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  PROTOTIPAGEM: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  EM_DESENVOLVIMENTO: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  CONCLUIDO: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

export default function PerfilPage() {
  const { user, login, token } = useAuth();
  const { addToast } = useToast();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [name,       setName]       = useState(user?.name ?? "");
  const [password,   setPassword]   = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [saving,     setSaving]     = useState(false);
  const [myData,     setMyData]     = useState(null);

  useEffect(() => {
    if (user?.role === "ALUNA") {
      apiFetch("/api/dashboard/my-data")
        .then((r) => r.ok ? r.json() : null)
        .then(setMyData)
        .catch(() => {});
    }
  }, [user?.role]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password && password !== confirmPwd) {
      return addToast("As senhas não coincidem.", "error");
    }
    if (password && password.length < 4) {
      return addToast("A senha deve ter pelo menos 4 caracteres.", "error");
    }

    setSaving(true);
    try {
      const body = { name };
      if (password) body.password = password;

      const res = await apiFetch(`/api/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Erro ao atualizar perfil.");

      login({ ...user, name: data.name }, token);
      setPassword("");
      setConfirmPwd("");
      addToast("Perfil atualizado com sucesso!", "success");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Meu Perfil</h2>
        <p className="text-slate-400 text-sm mt-0.5">Gerencie suas informações pessoais e senha.</p>
      </div>

      {/* Avatar + identidade */}
      <div className="card flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500
                        flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <p className="text-white font-bold text-lg truncate">{user?.name}</p>
            <label className="text-xs text-slate-400 flex items-center gap-2 ml-auto shrink-0">
              Tema
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
              >
                <option value="dark">Escuro</option>
                <option value="light">Claro</option>
              </select>
            </label>
          </div>
          <p className="text-slate-400 text-sm">{user?.email}</p>
          <span className={`inline-block mt-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${ROLE_STYLES[user?.role]}`}>
            {ROLE_LABELS[user?.role] ?? user?.role}
          </span>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="card space-y-5">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <UserCircle2 size={16} className="text-violet-400" />
          Dados pessoais
        </h3>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome</label>
          <input
            type="text" required placeholder="Seu nome completo"
            className="input-field" value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">E-mail</label>
          <input
            type="text" readOnly disabled
            className="input-field opacity-50 cursor-not-allowed"
            value={user?.email ?? ""}
          />
          <p className="text-slate-600 text-xs mt-1">O e-mail não pode ser alterado aqui.</p>
        </div>

        <hr className="border-slate-800" />

        <h3 className="text-white font-semibold flex items-center gap-2">
          <Lock size={16} className="text-violet-400" />
          Alterar senha
        </h3>
        <p className="text-slate-500 text-xs -mt-3">Deixe em branco para manter a senha atual.</p>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Nova senha</label>
          <input
            type="password" placeholder="••••••••"
            className="input-field" value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirmar nova senha</label>
          <input
            type="password" placeholder="••••••••"
            className="input-field" value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-60">
            {saving ? <><Loader2 size={15} className="animate-spin" />Salvando...</> : <><Save size={15} />Salvar alterações</>}
          </button>
        </div>
      </form>

      {/* Seção "Meu Time" para alunas */}
      {user?.role === "ALUNA" && (
        <div className="card space-y-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <BookOpen size={16} className="text-violet-400" />
            Meu Time
          </h3>

          {myData === null ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
              <Loader2 size={16} className="animate-spin" /> Carregando...
            </div>
          ) : (myData.teams?.length ?? 0) === 0 ? (
            <EmptyState compact icon={Users}
              title="Sem time vinculado"
              description="Acesse Tutorias e entre em um time com o código da mentora."
              action={{ label: "Ir para Equipes", onClick: () => navigate("/equipes") }}
            />
          ) : (
            <div className="space-y-3">
              {myData.teams.map((team) => (
                <div key={team.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 font-bold text-xs shrink-0">
                      {team.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm">{team.name}</p>
                      <p className="text-slate-500 text-xs">Mentora: {team.mentor?.name ?? "—"}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border hidden sm:block ${STATUS_TEAM_COLOR[team.status] ?? "text-slate-400 bg-slate-700 border-slate-600"}`}>
                      {STATUS_TEAM_LABEL[team.status] ?? team.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${STAGE_BG[team.myProgress?.stage ?? "INICIO"]} shrink-0`} />
                    <span className={`text-xs font-semibold ${STAGE_TEXT[team.myProgress?.stage ?? "INICIO"]}`}>
                      Etapa: {STAGE_LABELS[team.myProgress?.stage ?? "INICIO"]}
                    </span>
                  </div>

                  {team.myProgress?.notes && (
                    <p className="text-slate-400 text-xs leading-relaxed border-t border-slate-700 pt-3">
                      <span className="font-semibold text-violet-400">Feedback: </span>
                      {team.myProgress.notes}
                    </p>
                  )}
                </div>
              ))}

              <button
                onClick={() => navigate("/progresso")}
                className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 transition-colors"
              >
                <TrendingUp size={12} /> Ver progresso completo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
