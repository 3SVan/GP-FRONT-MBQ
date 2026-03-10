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

    const mapped = rawRoles
        .map((r) => {
            if (typeof r === "string") return r.toUpperCase();
            if (r && typeof r === "object" && r.name) return String(r.name).toUpperCase();
            return "";
        })
        .filter(Boolean);

    return [...new Set(mapped)];
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMe = useCallback(async () => {
        try {
            const res = await AuthAPI.me();
            const meUser = res?.data?.user || null;
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
        fetchMe();
    }, [fetchMe]);

    const refreshAuth = useCallback(async () => {
        setLoading(true);
        return fetchMe();
    }, [fetchMe]);

    const logout = useCallback(async () => {
        try {
            await AuthAPI.logout();
        } catch {
            // no-op
        } finally {
            setUser(null);
            setRoles([]);
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