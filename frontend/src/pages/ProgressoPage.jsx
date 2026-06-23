import { useEffect, useState, useCallback } from "react";
import { TrendingUp, Users, ChevronDown, ChevronUp, CheckCircle2, Loader2, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const STAGE_ORDER  = ["INICIO", "DESENVOLVENDO", "AVANCADO", "CONCLUIDO"];
const STAGE_LABELS = { INICIO: "Início", DESENVOLVENDO: "Desenvolvendo", AVANCADO: "Avançado", CONCLUIDO: "Concluído" };
const STAGE_BG     = { INICIO: "bg-slate-700", DESENVOLVENDO: "bg-sky-600", AVANCADO: "bg-violet-600", CONCLUIDO: "bg-emerald-600" };
const STAGE_TEXT   = { INICIO: "text-slate-400", DESENVOLVENDO: "text-sky-400", AVANCADO: "text-violet-400", CONCLUIDO: "text-emerald-400" };

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

/* ─── Stepper horizontal (leitura) ──────────────────────────────────────────── */
function ProgressStepper({ stage }) {
  const stageIdx = STAGE_ORDER.indexOf(stage ?? "INICIO");
  return (
    <div className="px-2 py-4">
      <div className="relative flex items-start justify-between">
        <div className="absolute left-0 right-0 top-4 h-0.5 bg-slate-800" />
        <div
          className="absolute left-0 top-4 h-0.5 bg-violet-600 transition-all duration-500"
          style={{ width: stageIdx === 0 ? "0%" : `${(stageIdx / (STAGE_ORDER.length - 1)) * 100}%` }}
        />
        {STAGE_ORDER.map((s, idx) => {
          const done    = idx < stageIdx;
          const current = idx === stageIdx;
          return (
            <div key={s} className="relative flex flex-col items-center gap-2 z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300
                ${done    ? "bg-violet-600 border-violet-600" : ""}
                ${current ? "bg-violet-600 border-violet-400 ring-4 ring-violet-500/20" : ""}
                ${!done && !current ? "bg-slate-900 border-slate-700" : ""}
              `}>
                {done ? (
                  <CheckCircle2 size={14} className="text-white" />
                ) : (
                  <span className={`text-[10px] font-bold ${current ? "text-white" : "text-slate-600"}`}>{idx + 1}</span>
                )}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wide text-center leading-tight w-14 sm:w-16
                ${current ? "text-violet-400" : done ? "text-slate-400" : "text-slate-600"}`}>
                {STAGE_LABELS[s]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── View da ALUNA ──────────────────────────────────────────────────────────── */
function AlunaView({ data, loading }) {
  const navigate = useNavigate();
  const teams = data?.teams ?? [];

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="card animate-pulse space-y-4">
            <div className="h-5 w-1/3 bg-slate-800 rounded" />
            <div className="h-20 bg-slate-800 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Nenhum progresso ainda"
        description="Entre em um time para começar a acompanhar sua jornada Technovation."
        action={{ label: "Ver Equipes", onClick: () => navigate("/equipes") }}
      />
    );
  }

  return (
    <div className="space-y-5">
      {teams.map((team) => (
        <div key={team.id} className="card space-y-5">
          {/* Cabeçalho */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 font-bold text-sm shrink-0">
              {team.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white">{team.name}</p>
              <p className="text-xs text-slate-500">Mentora: {team.mentor?.name ?? "—"}</p>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border hidden sm:block ${STATUS_TEAM_COLOR[team.status] ?? "text-slate-400 bg-slate-700 border-slate-600"}`}>
              {STATUS_TEAM_LABEL[team.status] ?? team.status}
            </span>
          </div>

          {/* Etapa atual */}
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${STAGE_BG[team.myProgress?.stage ?? "INICIO"]} shrink-0`} />
            <span className={`text-sm font-bold ${STAGE_TEXT[team.myProgress?.stage ?? "INICIO"]}`}>
              {STAGE_LABELS[team.myProgress?.stage ?? "INICIO"]}
            </span>
          </div>

          {/* Stepper */}
          <ProgressStepper stage={team.myProgress?.stage} />

          {/* Notas da mentora */}
          {team.myProgress?.notes ? (
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400 mb-2">Feedback da Mentora</p>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{team.myProgress.notes}</p>
            </div>
          ) : (
            <p className="text-slate-600 text-xs italic">Nenhum feedback da mentora ainda.</p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── View da MENTORA ────────────────────────────────────────────────────────── */
function MentoraView({ data, loading, onProgressSave }) {
  const navigate = useNavigate();
  const myTeams = data?.myTeams ?? [];
  const [openTeams, setOpenTeams] = useState({});
  const [localProgress, setLocalProgress] = useState({});
  const [savingMap, setSavingMap] = useState({});

  const toggleTeam = (id) => setOpenTeams((prev) => ({ ...prev, [id]: !prev[id] }));

  const updateLocal = (teamId, studentId, field, value) => {
    setLocalProgress((prev) => ({
      ...prev,
      [`${teamId}_${studentId}`]: {
        ...((prev[`${teamId}_${studentId}`]) ?? {}),
        [field]: value,
      },
    }));
  };

  const getLocal = (teamId, studentId, field, fallback) => {
    return localProgress[`${teamId}_${studentId}`]?.[field] ?? fallback;
  };

  const handleSave = async (teamId, studentId) => {
    const key = `${teamId}_${studentId}`;
    const patch = localProgress[key];
    if (!patch) return;
    setSavingMap((p) => ({ ...p, [key]: true }));
    await onProgressSave(teamId, studentId, patch);
    setSavingMap((p) => ({ ...p, [key]: false }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card animate-pulse h-16" />
        ))}
      </div>
    );
  }

  if (myTeams.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum time atribuído"
        description="Você ainda não possui equipes. Crie uma na página Tutorias."
        action={{ label: "Ir para Equipes", onClick: () => navigate("/equipes") }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {myTeams.map((team) => {
        const isOpen = !!openTeams[team.id];
        return (
          <div key={team.id} className="card overflow-hidden">
            {/* Cabeçalho do accordion */}
            <button
              onClick={() => toggleTeam(team.id)}
              className="w-full flex items-center gap-3 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 font-bold text-xs shrink-0">
                {team.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">{team.name}</p>
                <p className="text-xs text-slate-500">{team.studentCount} {team.studentCount === 1 ? "aluna" : "alunas"}</p>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border mr-2 hidden sm:block ${STATUS_TEAM_COLOR[team.status] ?? "text-slate-400 bg-slate-700 border-slate-600"}`}>
                {STATUS_TEAM_LABEL[team.status] ?? team.status}
              </span>
              {isOpen ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
            </button>

            {/* Corpo do accordion */}
            {isOpen && (
              <div className="mt-4 space-y-4 border-t border-slate-800 pt-4 animate-slide-up">
                {team.students.length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-4">Nenhuma aluna neste time ainda.</p>
                )}
                {team.students.map((student) => {
                  const key      = `${team.id}_${student.id}`;
                  const stage    = getLocal(team.id, student.id, "stage", student.progress?.stage ?? "INICIO");
                  const notes    = getLocal(team.id, student.id, "notes", student.progress?.notes ?? "");
                  const saving   = !!savingMap[key];
                  const isDirty  = !!localProgress[key];

                  return (
                    <div key={student.id} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700 space-y-3">
                      {/* Cabeçalho aluna */}
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-400 font-bold text-[10px] shrink-0">
                          {student.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{student.name}</p>
                          <p className="text-xs text-slate-500 truncate">{student.email}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STAGE_TEXT[stage]} ${STAGE_BG[stage]}/20`}>
                          {STAGE_LABELS[stage]}
                        </span>
                      </div>

                      {/* Select de fase */}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Etapa</label>
                        <select
                          value={stage}
                          onChange={(e) => updateLocal(team.id, student.id, "stage", e.target.value)}
                          className="input-field text-sm"
                        >
                          {STAGE_ORDER.map((s) => (
                            <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                          ))}
                        </select>
                      </div>

                      {/* Textarea de notas */}
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Feedback / Notas</label>
                        <textarea
                          rows={3}
                          value={notes}
                          onChange={(e) => updateLocal(team.id, student.id, "notes", e.target.value)}
                          placeholder="Adicione um feedback ou observação para esta aluna..."
                          className="input-field resize-none text-sm"
                        />
                      </div>

                      {/* Botão salvar */}
                      {isDirty && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleSave(team.id, student.id)}
                            disabled={saving}
                            className="btn-primary flex items-center gap-2 text-xs px-4 py-2"
                          >
                            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                            {saving ? "Salvando..." : "Salvar"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function ProgressoPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await apiFetch("/api/dashboard/my-data");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleProgressSave = useCallback(async (teamId, studentId, patch) => {
    try {
      const res = await apiFetch(`/api/teams/${teamId}/progress/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        addToast(err.message ?? "Erro ao salvar progresso.", "error");
        return;
      }
      addToast("Progresso atualizado com sucesso!", "success");
      // Atualiza localmente sem refetch
      setData((prev) => {
        if (!prev?.myTeams) return prev;
        return {
          ...prev,
          myTeams: prev.myTeams.map((t) =>
            t.id !== teamId ? t : {
              ...t,
              students: t.students.map((s) =>
                s.id !== studentId ? s : { ...s, progress: { ...s.progress, ...patch } }
              ),
            }
          ),
        };
      });
    } catch (e) {
      addToast("Erro de conexão ao salvar.", "error");
    }
  }, [addToast]);

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp size={20} className="text-violet-400" />
          {user.role === "ALUNA" ? "Meu Progresso" : "Progresso das Alunas"}
        </h2>
        <p className="text-slate-500 text-sm mt-0.5">
          {user.role === "ALUNA"
            ? "Acompanhe sua evolução na jornada Technovation Girls."
            : "Atualize o progresso e feedback de cada aluna nos seus times."}
        </p>
      </div>

      {user.role === "ALUNA" && <AlunaView data={data} loading={loading} />}
      {user.role === "MENTORA" && <MentoraView data={data} loading={loading} onProgressSave={handleProgressSave} />}
    </div>
  );
}
