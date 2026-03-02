// src/pages/approver/components/Chip.jsx
import React from "react";

export default function Chip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full border text-xs font-semibold transition ${
        active
          ? "bg-midBlue text-white border-midBlue"
          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-lightBlue"
      }`}
    >
      {children}
    </button>
  );
}