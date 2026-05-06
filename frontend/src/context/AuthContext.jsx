import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tutoria_user")); }
    catch { return null; }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem("tutoria_token") ?? null
  );

  const login = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem("tutoria_user",  JSON.stringify(userData));
    localStorage.setItem("tutoria_token", accessToken);
  };

  const impersonate = (userData, accessToken) => {
    // Salva o token de admin original na sessionStorage para poder voltar
    const originalToken = localStorage.getItem("tutoria_token");
    const originalUser  = localStorage.getItem("tutoria_user");
    if (originalToken) sessionStorage.setItem("admin_token", originalToken);
    if (originalUser)  sessionStorage.setItem("admin_user", originalUser);

    setUser(userData);
    setToken(accessToken);
    localStorage.setItem("tutoria_user",  JSON.stringify({ ...userData, isImpersonated: true }));
    localStorage.setItem("tutoria_token", accessToken);
  };

  const stopImpersonating = () => {
    const adminToken = sessionStorage.getItem("admin_token");
    const adminUser  = sessionStorage.getItem("admin_user");

    if (adminToken && adminUser) {
      const userData = JSON.parse(adminUser);
      setUser(userData);
      setToken(adminToken);
      localStorage.setItem("tutoria_user", adminUser);
      localStorage.setItem("tutoria_token", adminToken);
      sessionStorage.removeItem("admin_token");
      sessionStorage.removeItem("admin_user");
    } else {
      logout();
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("tutoria_user");
    localStorage.removeItem("tutoria_token");
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_user");
  };

  return (
    <AuthContext.Provider value={{
      user, token,
      login, logout, impersonate, stopImpersonating,
      isAuthenticated: !!user,
      isImpersonating: !!user?.isImpersonated
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
