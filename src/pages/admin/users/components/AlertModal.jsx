// src/pages/admin/users/components/AlertModal.jsx
import React from "react";
import SystemAlert from "../../../../components/ui/SystemAlert";

export default function AlertModal({ open, config, onClose }) {
  const alertConfig = config || {
    type: "info",
    title: "",
    message: "",
    showConfirm: false,
    onConfirm: null,
  };

  return (
    <SystemAlert
      open={open}
      type={alertConfig.type}
      title={alertConfig.title}
      message={alertConfig.message}
      onClose={onClose}
      showConfirm={alertConfig.showConfirm}
      onConfirm={alertConfig.onConfirm}
      confirmText="Confirmar"
      cancelText="Cancelar"
      acceptText="Aceptar"
    />
  );
}