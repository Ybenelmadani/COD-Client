import { createContext, useContext, useEffect, useState } from "react";
import { api, ApiError } from "./api.js";

const AuthContext = createContext(null);

const KEY = "codsh.token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(KEY));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.me(token).then(setUser).catch(() => logout()).finally(() => setLoading(false));
  }, [token]);

  function login(t, u) {
    localStorage.setItem(KEY, t);
    setToken(t);
    setUser(u);
  }

  function logout() {
    localStorage.removeItem(KEY);
    setToken(null);
    setUser(null);
  }

  function refresh() {
    if (token) api.me(token).then(setUser).catch(() => {});
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
