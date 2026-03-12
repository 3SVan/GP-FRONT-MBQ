// src/components/ui/PageHeader.jsx
import React from "react";

export default function PageHeader({
  title,
  subtitle,
  action,
  className = "",
}) {
  return (
    <div
      className={`mb-6 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-gray-800 sm:text-xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          ) : null}
        </div>

        {action ? (
          <div className="flex w-full justify-start sm:w-auto sm:justify-end">
            {action}
          </div>
        ) : null}
      </div>
    </div>
  );
}