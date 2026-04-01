import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiFetch } from "../lib/api";

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

function getDefaultStartDate() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return toDateInputValue(d);
}

function formatPeriodLabel(period, groupBy) {
  if (!period) return "";
  if (groupBy === "month") return period;
  if (groupBy === "week") return period;
  return period.slice(5);
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [topTerms, setTopTerms] = useState([]);
  const [questionsByPeriod, setQuestionsByPeriod] = useState([]);
  const [groupBy, setGroupBy] = useState("day");

  const [filters, setFilters] = useState({
    startDate: getDefaultStartDate(),
    endDate: toDateInputValue(new Date()),
    groupBy: "day",
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);

  useEffect(() => {
    let mounted = true;

    async function loadAnalytics() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          startDate: appliedFilters.startDate,
          endDate: appliedFilters.endDate,
          groupBy: appliedFilters.groupBy,
        });

        const response = await apiFetch(`/api/analytics/top-terms?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Falha ao carregar analytics.");
        }

        if (!mounted) return;
        setTopTerms(Array.isArray(data.topTerms) ? data.topTerms : []);
        setQuestionsByPeriod(Array.isArray(data.questionsByPeriod) ? data.questionsByPeriod : []);
        setGroupBy(data.groupBy || appliedFilters.groupBy);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Falha ao carregar analytics.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAnalytics();
    return () => {
      mounted = false;
    };
  }, [appliedFilters]);

  const chartData = useMemo(
    () =>
      questionsByPeriod.map((item) => ({
        ...item,
        label: formatPeriodLabel(item.period, groupBy),
      })),
    [questionsByPeriod, groupBy],
  );

  const chartTitle =
    groupBy === "week"
      ? "Perguntas por Semana"
      : groupBy === "month"
        ? "Perguntas por Mês"
        : "Perguntas por Dia";

  function handleApplyFilters() {
    if (filters.startDate > filters.endDate) {
      setError("A data inicial não pode ser maior que a data final.");
      return;
    }
    setAppliedFilters(filters);
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics IA</h1>
        <p className="text-slate-400 text-sm mt-1">
          Monitoramento das perguntas feitas no chat e termos mais buscados.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <label className="text-sm text-slate-300">
            Data inicial
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200"
            />
          </label>

          <label className="text-sm text-slate-300">
            Data final
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
              className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200"
            />
          </label>

          <label className="text-sm text-slate-300">
            Agrupamento
            <select
              value={filters.groupBy}
              onChange={(e) => setFilters((prev) => ({ ...prev, groupBy: e.target.value }))}
              className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-slate-200"
            >
              <option value="day">Por dia</option>
              <option value="week">Por semana</option>
              <option value="month">Por mês</option>
            </select>
          </label>

          <button
            type="button"
            onClick={handleApplyFilters}
            className="h-[42px] rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium"
          >
            Aplicar filtro
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Nuvem de Termos (lista)</h2>

          {loading ? (
            <p className="text-sm text-slate-400">Carregando termos...</p>
          ) : topTerms.length === 0 ? (
            <p className="text-sm text-slate-500">Sem termos relevantes na ultima semana.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topTerms.map((item) => (
                <span
                  key={item.term}
                  className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-sm text-violet-200"
                >
                  {item.term} ({item.count})
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">{chartTitle}</h2>

          {loading ? (
            <p className="text-sm text-slate-400">Carregando grafico...</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="label" stroke="#94a3b8" />
                  <YAxis allowDecimals={false} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #334155",
                      color: "#e2e8f0",
                    }}
                    labelStyle={{ color: "#cbd5e1" }}
                  />
                  <Bar dataKey="total" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
