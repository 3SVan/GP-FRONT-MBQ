// src/components/ui/InlineLoading.jsx
import React from "react";
import { Loader2 } from "lucide-react";

export default function InlineLoading({
  text = "Cargando...",
  className = "",
  center = false,
}) {
  return (
    <div
      className={`flex items-center gap-2 text-sm text-gray-500 ${
        center ? "justify-center" : ""
      } ${className}`}
    >
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{text}</span>
    </div>
  );
}