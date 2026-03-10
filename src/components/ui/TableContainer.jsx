// src/components/ui/TableContainer.jsx
import React from "react";
import LoadingState from "./LoadingState";

export default function TableContainer({
  loading = false,
  loadingTitle = "Cargando información...",
  loadingSubtitle = "Estamos preparando la información.",
  children,
  className = "",
}) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-4">
            <LoadingState
              compact
              title={loadingTitle}
              subtitle={loadingSubtitle}
            />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}