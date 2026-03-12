import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function InlineScreenLoader() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8f5ef] px-6">
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl px-6 py-5 text-center">
                <div className="w-8 h-8 mx-auto mb-3 border-4 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
                <p className="text-sm text-slate-600">Validando sesión...</p>
            </div>
        </div>
    );
}

function getDashboardByRole(roles = []) {
    if (roles.includes("ADMIN")) return "/admin";
    if (roles.includes("APPROVER")) return "/approver";
    if (roles.includes("PROVIDER")) return "/provider";
    return "/login";
}

export default function ProtectedRoute({ allowedRoles = [] }) {
    const { loading, isAuthenticated, roles, mustChangePassword } = useAuth();
    const location = useLocation();

    if (loading) {
        return <InlineScreenLoader />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    if (mustChangePassword && location.pathname !== "/cambio-pass") {
        return <Navigate to="/cambio-pass" replace />;
    }

    if (allowedRoles.length > 0) {
        const hasRole = roles.some((role) => allowedRoles.includes(role));

        if (!hasRole) {
            return <Navigate to={getDashboardByRole(roles)} replace />;
        }
    }

    return <Outlet />;
}