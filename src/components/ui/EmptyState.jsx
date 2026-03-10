// src/components/ui/EmptyState.jsx
import React from "react";

export default function EmptyState({
  icon: Icon,
  title = "Sin resultados",
  subtitle = "No hay información para mostrar.",
  action = null,
  className = "",
}) {
  return (
    <div className={`px-6 py-12 text-center ${className}`}>
      {Icon ? (
        <div className="mb-4 flex justify-center text-gray-400">
          <Icon className="h-12 w-12" />
        </div>
      ) : null}

      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>

      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}