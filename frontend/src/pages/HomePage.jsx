import { useEffect, useState } from "react";

export default function HomePage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao buscar usuários");
        return res.json();
      })
      .then((data) => setUsers(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Hero */}
      <div className="text-center mb-12">
        <span className="inline-block bg-primary-500/20 text-primary-500 text-sm font-semibold
                         px-4 py-1.5 rounded-full mb-4 tracking-wide">
          Projeto Social
        </span>
        <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
          Tutoria Tech 🚀
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Sistema de tutoria tecnológica para democratizar o acesso ao
          conhecimento em programação e tecnologia.
        </p>
      </div>

      {/* Status Card */}
      <div className="card w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Usuários Cadastrados</h2>
          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-medium">
            API Conectada ✓
          </span>
        </div>

        {loading && (
          <div className="flex items-center gap-3 text-slate-400">
            <span className="inline-block w-4 h-4 border-2 border-primary-500
                             border-t-transparent rounded-full animate-spin" />
            Carregando usuários...
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30
                       rounded-lg px-4 py-3">
            ⚠️ {error}
          </p>
        )}

        {!loading && !error && users.length === 0 && (
          <p className="text-slate-500 text-sm">Nenhum usuário encontrado.</p>
        )}

        {!loading && !error && users.length > 0 && (
          <ul className="space-y-3">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between bg-slate-900/60
                           border border-slate-700/50 rounded-xl px-5 py-3"
              >
                <div>
                  <p className="font-medium text-white">{user.name}</p>
                  <p className="text-slate-400 text-sm">{user.email}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  user.role === "ADMIN"
                    ? "bg-purple-500/20 text-purple-400"
                    : user.role === "TUTOR"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-slate-600/40 text-slate-300"
                }`}>
                  {user.role}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-slate-600 text-xs mt-8">
        Backend rodando em{" "}
        <code className="text-primary-400">http://localhost:3001</code>
      </p>
    </main>
  );
}
