import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const QUICK_LOGINS = [
  {
    label: "Admin",
    email: "admin@projeto.com",
    password: "admin",
    color: "bg-purple-500/15 border-purple-500/30 text-purple-300 hover:bg-purple-500/25",
    dot: "bg-purple-500",
  },
  {
    label: "Mentora",
    email: "mentora1@tutoria.com",
    password: "password123",
    color: "bg-blue-500/15 border-blue-500/30 text-blue-300 hover:bg-blue-500/25",
    dot: "bg-blue-500",
  },
  {
    label: "Aluna",
    email: "aluna1@tutoria.com",
    password: "password123",
    color: "bg-slate-600/30 border-slate-600/40 text-slate-300 hover:bg-slate-600/50",
    dot: "bg-violet-400",
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState(null);

  const doLogin = async (email, password) => {
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Credenciais inválidas.");
      login(data.user, data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await doLogin(form.email, form.password);
    setLoading(false);
  };

  const handleQuickLogin = async (ql) => {
    setQuickLoading(ql.label);
    setForm({ email: ql.email, password: ql.password });
    await doLogin(ql.email, ql.password);
    setQuickLoading(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center
                    bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 p-4">
      {/* Glow decorativo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-pink-600/15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-slate-900/80 backdrop-blur border border-slate-700/60 rounded-3xl shadow-2xl p-8">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500
                            flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30">
              <Sparkles size={26} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Tutoria Meninas</h1>
            <p className="text-slate-400 text-sm mt-1">Technovation STEM — Acesse sua conta</p>
          </div>

          {/* Acesso rápido por papel */}
          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2.5 text-center">
              Acesso rápido para testes
            </p>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_LOGINS.map((ql) => (
                <button
                  key={ql.label}
                  type="button"
                  onClick={() => handleQuickLogin(ql)}
                  disabled={!!quickLoading || loading}
                  className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all duration-150 disabled:opacity-50 ${ql.color}`}
                >
                  {quickLoading === ql.label ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <span className={`w-2 h-2 rounded-full ${ql.dot}`} />
                  )}
                  {ql.label}
                </button>
              ))}
            </div>
          </div>

          {/* Divisor */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-slate-600 text-[10px] uppercase tracking-widest font-bold">ou entre manualmente</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">E-mail</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="seuemail@exemplo.com"
                  className="input-field pl-10"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="input-field pl-10"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                <AlertCircle size={15} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !!quickLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2
                         bg-gradient-to-r from-violet-600 to-violet-700
                         hover:from-violet-500 hover:to-violet-600
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Entrando...</> : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
