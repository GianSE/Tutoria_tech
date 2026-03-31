/**
 * Helper de fetch autenticado.
 * Adiciona automaticamente o Authorization: Bearer <token> em toda chamada.
 * Redireciona para /login se receber 401.
 */
export function apiFetch(url, options = {}) {
  const token = localStorage.getItem("tutoria_token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  return fetch(url, { ...options, headers }).then((res) => {
    if (res.status === 401) {
      localStorage.removeItem("tutoria_user");
      localStorage.removeItem("tutoria_token");
      window.location.href = "/login";
    }
    return res;
  });
}
