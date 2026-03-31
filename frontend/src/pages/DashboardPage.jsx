import { useEffect, useState } from "react";
import { Users, BookOpen, CalendarDays, TrendingUp, Star, Zap, Loader2, AlertCircle } from "lucide-react";

function StatCard({ label, value, change, icon: Icon, gradient, glow, loading }) {
  return (
    <div className="card hover:border-slate-600 transition-colors duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient}
                        flex items-center justify-center shadow-lg ${glow}`}>
          <Icon size={20} className="text-white" />
        </div>
        <TrendingUp size={14} className="text-emerald-400" />
      </div>
      {loading ? (
        <div className="w-16 h-8 bg-slate-800 rounded animate-pulse mb-1" />
      ) : (
        <p className="text-3xl font-bold text-white mb-1">{value ?? "—"}</p>
      )}
      <p className="text-slate-400 text-sm">{label}</p>
      {change && <p className="text-xs mt-2 font-medium text-emerald-400">{change}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => { if (!r.ok) throw new Error("Erro ao carregar estatísticas"); return r.json(); })
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const CARDS = [
    {
      label: "Total de Alunas",
      value: stats?.totalAlunas,
      icon: Users,
      gradient: "from-violet-600 to-violet-800",
      glow: "shadow-violet-500/20",
    },
    {
      label: "Equipes Ativas",
      value: stats?.equipesAtivas,
      icon: Star,
      gradient: "from-pink-600 to-rose-700",
      glow: "shadow-pink-500/20",
    },
    {
      label: "Sessões Realizadas",
      value: stats?.sessoesRealizadas,
      icon: CalendarDays,
      gradient: "from-sky-600 to-blue-700",
      glow: "shadow-sky-500/20",
    },
    {
      label: "Materiais Publicados",
      value: stats?.materiaisPublicados,
      icon: Zap,
      gradient: "from-emerald-600 to-teal-700",
      glow: "shadow-emerald-500/20",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white">Painel Geral 👋</h2>
        <p className="text-slate-400 text-sm mt-1">
          Indicadores em tempo real do programa Tutoria Meninas — Technovation STEM.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30
                        rounded-xl px-4 py-3 text-red-400 text-sm">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {CARDS.map((card) => (
          <StatCard key={card.label} {...card} loading={loading} />
        ))}
      </div>

      {/* Atividade + Progresso */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Atividade Recente */}
        <div className="card lg:col-span-2">
          <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
            <BookOpen size={16} className="text-violet-400" />
            Atividade Recente
          </h3>

          {loading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-slate-800 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="w-3/4 h-3.5 bg-slate-800 rounded animate-pulse" />
                    <div className="w-1/4 h-2.5 bg-slate-800 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && stats?.atividadesRecentes?.length === 0 && (
            <p className="text-slate-500 text-sm">Nenhuma atividade registrada ainda.</p>
          )}

          {!loading && (
            <ul className="space-y-3">
              {(stats?.atividadesRecentes ?? []).map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 text-sm leading-snug">{a.description}</p>
                    <p className="text-slate-600 text-xs mt-0.5">
                      {new Date(a.createdAt).toLocaleString("pt-BR", {
                        day: "2-digit", month: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Fases das Equipes — dados reais do banco */}
        <div className="card">
          <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
            <Star size={16} className="text-pink-400" />
            Fases das Equipes
          </h3>
          <p className="text-slate-600 text-xs mb-5">Technovation 2025 — distribuição atual</p>

          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-1.5 animate-pulse">
                  <div className="w-1/2 h-3 bg-slate-800 rounded" />
                  <div className="h-1.5 bg-slate-800 rounded-full" />
                </div>
              ))}
            </div>
          ) : (stats?.equipesAtivas ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Star size={28} className="text-slate-700 mb-2" />
              <p className="text-slate-500 text-sm">Nenhuma equipe cadastrada ainda.</p>
              <p className="text-slate-600 text-xs mt-1">Crie equipes em Tutorias.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { key: "IDEACAO",           label: "Ideação",            color: "from-amber-500  to-orange-500"  },
                { key: "PROTOTIPAGEM",      label: "Prototipagem",       color: "from-sky-500    to-blue-600"    },
                { key: "EM_DESENVOLVIMENTO",label: "Desenvolvimento",    color: "from-violet-500 to-purple-600"  },
                { key: "CONCLUIDO",         label: "Concluído",          color: "from-emerald-500 to-teal-600"   },
              ].map(({ key, label, color }) => {
                const count = stats?.teamsPerStatus?.[key] ?? 0;
                const total = stats?.equipesAtivas ?? 1;
                const pct   = Math.round((count / total) * 100);
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400">{label}</span>
                      <span className="text-slate-500 font-medium">
                        {count} {count === 1 ? "equipe" : "equipes"} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
