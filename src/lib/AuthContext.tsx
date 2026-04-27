"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import {
  authLogin,
  authRegister,
  authRefresh,
  authRecoveryPassword,
  type User,
  type AuthTokens,
} from "./api";

interface StoredAuth {
  user: User;
  tokens: AuthTokens;
  expiresAt: number; // timestamp ms
}

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  getValidToken: () => Promise<string | null>;
  login: (email: string, password: string, idgroup?: number) => Promise<string | null>;
  register: (name: string, lastname: string, email: string, password: string, idgroup?: number) => Promise<string | null>;
  recoverPassword: (email: string, idgroup?: number) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "pf_auth";

function saveToStorage(user: User, tokens: AuthTokens) {
  const expiresAt = Date.now() + tokens.expires_in * 1000;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, tokens, expiresAt }));
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

function loadFromStorage(): StoredAuth | null {
  try {
    const str = localStorage.getItem(STORAGE_KEY);
    if (!str) return null;
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const refreshingRef = useRef<Promise<string | null> | null>(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored) {
      setUser(stored.user);
      setTokens(stored.tokens);
      setExpiresAt(stored.expiresAt);
    }
    setLoading(false);
  }, []);

  const updateAuth = useCallback((newUser: User, newTokens: AuthTokens) => {
    setUser(newUser);
    setTokens(newTokens);
    const exp = Date.now() + newTokens.expires_in * 1000;
    setExpiresAt(exp);
    saveToStorage(newUser, newTokens);
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setTokens(null);
    setExpiresAt(0);
    clearStorage();
  }, []);

  // Get a valid token, refreshing if expired or about to expire (60s buffer)
  const getValidToken = useCallback(async (): Promise<string | null> => {
    if (!tokens) return null;

    // Still valid (with 60s buffer)
    if (Date.now() < expiresAt - 60_000) {
      return tokens.access_token;
    }

    // Already refreshing — wait for it
    if (refreshingRef.current) {
      return refreshingRef.current;
    }

    // Need to refresh
    refreshingRef.current = (async () => {
      try {
        const res = await authRefresh(tokens.refresh_token);
        if (res.success) {
          updateAuth(res.data.user, res.data.auth);
          return res.data.auth.access_token;
        }
        clearAuth();
        return null;
      } catch {
        clearAuth();
        return null;
      } finally {
        refreshingRef.current = null;
      }
    })();

    return refreshingRef.current;
  }, [tokens, expiresAt, updateAuth, clearAuth]);

  const login = useCallback(async (email: string, password: string, idgroup?: number): Promise<string | null> => {
    try {
      const res = await authLogin(email, password, idgroup);
      if (res.success) {
        updateAuth(res.data.user, res.data.auth);
        return null;
      }
      return res.message || "Error al iniciar sesión";
    } catch (err: any) {
      return err?.response?.data?.message || "Error al iniciar sesión";
    }
  }, [updateAuth]);

  const register = useCallback(async (
    name: string,
    lastname: string,
    email: string,
    password: string,
    idgroup?: number,
  ): Promise<string | null> => {
    try {
      const res = await authRegister(name, lastname, email, password, idgroup);
      if (res.success) {
        updateAuth(res.data.user, res.data.auth);
        return null;
      }
      return res.message || "Error al registrarse";
    } catch (err: any) {
      return err?.response?.data?.message || "Error al registrarse";
    }
  }, [updateAuth]);

  const recoverPassword = useCallback(async (email: string, idgroup?: number): Promise<string | null> => {
    try {
      const res = await authRecoveryPassword(email, idgroup);
      if (res.success) return null;
      return res.message || "Error al recuperar contraseña";
    } catch (err: any) {
      return err?.response?.data?.message || "Error al recuperar contraseña";
    }
  }, []);

  return (
    <AuthContext value={{
      user,
      accessToken: tokens?.access_token ?? null,
      isAuthenticated: !!user,
      loading,
      getValidToken,
      login,
      register,
      recoverPassword,
      logout: clearAuth,
    }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
