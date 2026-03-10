// src/pages/admin/sat/VerificacionR.jsx
import React, { useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { SatAPI } from "../../../api/sat.api";
import SystemAlert from "../../../components/ui/SystemAlert";
import InlineLoading from "../../../components/ui/InlineLoading";
import PageHeader from "../../../components/ui/PageHeader";

function VerificacionR() {
  const [rfc, setRfc] = useState("");
  const [loading, setLoading] = useState(false);

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: "",
    title: "",
    message: "",
    showConfirm: false,
    onConfirm: null,
  });

  const validarLongitudRFC = (value) =>
    value.length >= 12 && value.length <= 13;

  const showAlert = (
    type,
    title,
    message,
    showConfirm = false,
    onConfirm = null,
  ) => {
    setAlertConfig({ type, title, message, showConfirm, onConfirm });
    setAlertOpen(true);
  };

  const buscarRFC = async () => {
    const raw = rfc.replace(/\s+/g, "").trim().toUpperCase();

    if (!raw) {
      showAlert(
        "error",
        "RFC Requerido",
        "Por favor ingrese un RFC para realizar la búsqueda.",
      );
      return;
    }

    if (!validarLongitudRFC(raw)) {
      showAlert(
        "error",
        "Longitud Inválida",
        "El RFC debe tener entre 12 y 13 caracteres.",
      );
      return;
    }

    try {
      setLoading(true);

      const { data } = await SatAPI.quickCheckRfc(raw);

      if (data?.found) {
        showAlert(
          "error",
          "RFC No Aceptado",
          `Identificado en la lista SAT.\n` +
            `${data?.situation ? `Situación: ${data.situation}\n` : ""}` +
            `${data?.name ? `Nombre: ${data.name}` : ""}`.trim(),
        );
      } else {
        showAlert(
          "success",
          "RFC Aceptado",
          "No se encuentra en el listado cargado del SAT (según la última actualización).",
        );
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Error consultando SAT";
      showAlert("error", "Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") buscarRFC();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="Verificación de RFC"
          subtitle="Consulta si un proveedor se encuentra dentro de la lista negra del SAT."
        />

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-800">
              Consulta de RFC
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Ingresa el RFC del proveedor para verificar su estatus.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="rfc"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                RFC del proveedor *
              </label>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>

                <input
                  type="text"
                  id="rfc"
                  value={rfc}
                  onChange={(e) => setRfc(e.target.value.toUpperCase())}
                  onKeyDown={handleKeyDown}
                  placeholder="Ingresa el RFC (12-13 caracteres)"
                  className="block w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={13}
                  disabled={loading}
                />
              </div>

              <p className="mt-2 text-xs text-gray-500">
                El RFC debe contener entre 12 y 13 caracteres.
              </p>
            </div>

            <button
              onClick={buscarRFC}
              disabled={!rfc.trim() || loading}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition ${
                !rfc.trim() || loading
                  ? "cursor-not-allowed bg-gray-300 text-gray-500"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              {loading ? "Verificando..." : "Verificar RFC"}
            </button>

            {loading && (
              <div className="pt-1">
                <InlineLoading text="Verificando RFC..." />
              </div>
            )}
          </div>
        </div>
      </div>

      <SystemAlert
        open={alertOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertOpen(false)}
        showConfirm={alertConfig.showConfirm}
        onConfirm={alertConfig.onConfirm}
        confirmText="Confirmar"
        cancelText="Cancelar"
        acceptText="Aceptar"
      />
    </div>
  );
}

export default VerificacionR;