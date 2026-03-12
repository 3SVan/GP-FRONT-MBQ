// src/context/AuthContext.jsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AuthAPI } from "../api/auth.api";

const AuthContext = createContext(null);

function normalizeRoles(rawRoles) {
  if (!Array.isArray(rawRoles)) return [];

  return [
    ...new Set(
      rawRoles
        .map((r) => {
          if (typeof r === "string") return r.toUpperCase();
          if (r && typeof r === "object" && r.name) {
            return String(r.name).toUpperCase();
          }
          return "";
        })
        .filter(Boolean)
    ),
  ];
}

function extractUser(response) {
  if (!response) return null;
  if (response.data?.user) return response.data.user;
  if (response.user) return response.user;
  return null;
}

export function getDashboardByRole(roles = []) {
  if (roles.includes("ADMIN")) return "/admin";
  if (roles.includes("APPROVER")) return "/approver";
  if (roles.includes("PROVIDER")) return "/provider";
  return "/login";
}

function isPublicPath(pathname) {
  const publicPaths = ["/", "/login", "/autentificacion"];
  return publicPaths.includes(pathname);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await AuthAPI.me();
      const meUser = extractUser(res);
      const normalizedRoles = normalizeRoles(meUser?.roles || []);

      setUser(meUser);
      setRoles(normalizedRoles);
      return meUser;
    } catch {
      setUser(null);
      setRoles([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const currentPath = window.location.pathname;

    if (isPublicPath(currentPath)) {
      setLoading(false);
      setUser(null);
      setRoles([]);
      return;
    }

    fetchMe();
  }, [fetchMe]);

  const refreshAuth = useCallback(async () => {
    setLoading(true);
    return await fetchMe();
  }, [fetchMe]);

  const logout = useCallback(async () => {
    try {
      await AuthAPI.logout();
    } catch {
      // no-op
    } finally {
      setUser(null);
      setRoles([]);
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      roles,
      loading,
      isAuthenticated: Boolean(user),
      mustChangePassword: Boolean(user?.mustChangePassword),
      refreshAuth,
      logout,
    }),
    [user, roles, loading, refreshAuth, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}