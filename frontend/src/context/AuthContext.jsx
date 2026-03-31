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

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("tutoria_user");
    localStorage.removeItem("tutoria_token");
  };

  return (
    <AuthContext.Provider value={{
      user, token,
      login, logout,
      isAuthenticated: !!user,
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
