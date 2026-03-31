import { useState } from "react";
import { UserCircle2, Lock, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";

const ROLE_LABELS = { ADMIN: "Administrador", MENTORA: "Mentora", ALUNA: "Aluna" };
const ROLE_STYLES = {
  ADMIN:   "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  MENTORA: "bg-blue-500/20   text-blue-400   border border-blue-500/30",
  ALUNA:   "bg-slate-600/40  text-slate-300  border border-slate-600/40",
};

export default function PerfilPage() {
  const { user, login, token } = useAuth();

  const [name,        setName]        = useState(user?.name  ?? "");
  const [password,    setPassword]    = useState("");
  const [confirmPwd,  setConfirmPwd]  = useState("");
  const [saving,      setSaving]      = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [error,       setError]       = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (password && password !== confirmPwd) {
      return setError("As senhas não coincidem.");
    }
    if (password && password.length < 4) {
      return setError("A senha deve ter pelo menos 4 caracteres.");
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

      // Atualiza o contexto com o novo nome
      login({ ...user, name: data.name }, token);
      setPassword("");
      setConfirmPwd("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err.message);
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
        <div>
          <p className="text-white font-bold text-lg">{user?.name}</p>
          <p className="text-slate-400 text-sm">{user?.email}</p>
          <span className={`inline-block mt-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${ROLE_STYLES[user?.role]}`}>
            {ROLE_LABELS[user?.role] ?? user?.role}
          </span>
        </div>
      </div>

      {/* Formulário de edição */}
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

        {/* Feedback */}
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10
                          border border-red-500/30 rounded-xl px-4 py-3">
            <AlertCircle size={14} />{error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10
                          border border-emerald-500/30 rounded-xl px-4 py-3">
            <CheckCircle2 size={14} /> Perfil atualizado com sucesso!
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-60">
            {saving ? <><Loader2 size={15} className="animate-spin" />Salvando...</> : <><Save size={15} />Salvar alterações</>}
          </button>
        </div>
      </form>
    </div>
  );
}
