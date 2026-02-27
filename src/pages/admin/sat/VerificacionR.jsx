import React, { useState } from "react";
import { Search, CheckCircle, XCircle, X } from "lucide-react";
import { SatAPI } from "../../../api/sat.api"; // ✅ ajusta si tu ruta cambia

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

  const validarLongitudRFC = (value) => value.length >= 12 && value.length <= 13;

  const showAlert = (type, title, message, showConfirm = false, onConfirm = null) => {
    setAlertConfig({ type, title, message, showConfirm, onConfirm });
    setAlertOpen(true);
  };

  const Alert = () => {
    if (!alertOpen) return null;

    const alertStyles = {
      success: {
        bg: "bg-green-50",
        border: "border-green-200",
        icon: <CheckCircle className="w-6 h-6 text-green-600" />,
        button: "bg-green-600 hover:bg-green-700",
        text: "text-green-800",
      },
      error: {
        bg: "bg-red-50",
        border: "border-red-200",
        icon: <XCircle className="w-6 h-6 text-red-600" />,
        button: "bg-red-600 hover:bg-red-700",
        text: "text-red-800",
      },
    };

    const style = alertStyles[alertConfig.type] || alertStyles.error;

    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity backdrop-blur-sm" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl shadow-2xl border-2 ${style.bg} ${style.border} w-full max-w-sm sm:max-w-md`}>
            <div className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0">{style.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-base sm:text-lg font-semibold ${style.text} mb-2`}>
                    {alertConfig.title}
                  </h3>
                  <p className="text-gray-700 whitespace-pre-line text-sm sm:text-base">
                    {alertConfig.message}
                  </p>
                  <button
                    onClick={() => setAlertOpen(false)}
                    className={`mt-3 sm:mt-4 px-4 sm:px-6 py-2 text-white rounded-lg transition ${style.button} font-medium text-sm sm:text-base`}
                  >
                    Aceptar
                  </button>
                </div>
                <button
                  onClick={() => setAlertOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition flex-shrink-0 mt-1"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  // ✅ AHORA consulta el backend (BD)
const buscarRFC = async () => {
  const raw = rfc.replace(/\s+/g, "").trim().toUpperCase();

  // ✅ 1) Validaciones ANTES de pegar al backend
  if (!raw) {
    showAlert("error", "RFC Requerido", "Por favor ingrese un RFC para realizar la búsqueda.");
    return;
  }

  if (!validarLongitudRFC(raw)) {
    showAlert("error", "Longitud Inválida", "El RFC debe tener entre 12 y 13 caracteres.");
    return;
  }

  // ✅ 2) Un solo request
  try {
    setLoading(true);

    const { data } = await SatAPI.quickCheckRfc(raw);
    // data: { found:boolean, rfc, situation?, name?, data? }

    if (data?.found) {
      showAlert(
        "error",
        "RFC No Aceptado",
        `Identificado en la lista SAT.\n` +
          `${data?.situation ? `Situación: ${data.situation}\n` : ""}` +
          `${data?.name ? `Nombre: ${data.name}` : ""}`.trim()
      );
    } else {
      showAlert(
        "success",
        "RFC Aceptado",
        "No se encuentra en el listado cargado del SAT (según la última actualización)."
      );
    }
  } catch (err) {
    const msg = err?.response?.data?.message || "Error consultando SAT";
    showAlert("error", "Error", msg);
  } finally {
    setLoading(false);
  }
};

  const handleKeyPress = (e) => {
    if (e.key === "Enter") buscarRFC();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-beige min-h-screen">
      <div className="max-w-2xl lg:max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-darkBlue mb-3 sm:mb-4">
            Verificación de RFC
          </h1>
          <p className="text-midBlue text-base sm:text-lg lg:text-xl">
            Consulta de proveedores en lista negra del SAT
          </p>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl border-2 border-lightBlue p-4 sm:p-6 lg:p-8 shadow-lg">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-darkBlue mb-2">
              Consulta de RFC
            </h2>
            <p className="text-midBlue text-sm sm:text-base">
              Ingresa el RFC del proveedor para verificar si se encuentra en la lista negra del SAT
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="rfc" className="block text-sm sm:text-base font-medium text-darkBlue mb-2">
                RFC del Proveedor *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 text-midBlue" />
                </div>
                <input
                  type="text"
                  id="rfc"
                  value={rfc}
                  onChange={(e) => setRfc(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  placeholder="Ingresa el RFC (12-13 caracteres)"
                  className="block w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 border-2 border-lightBlue rounded-lg focus:ring-2 focus:ring-midBlue focus:border-midBlue text-darkBlue placeholder-midBlue text-sm sm:text-base"
                  maxLength={13}
                  disabled={loading}
                />
              </div>
            </div>

            <button
              onClick={buscarRFC}
              disabled={!rfc.trim() || loading}
              className="w-full bg-midBlue text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-darkBlue transition duration-200 font-medium disabled:bg-lightBlue disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              {loading ? "Verificando..." : "Verificar RFC"}
            </button>
          </div>
        </div>
      </div>

      <Alert />
    </div>
  );
}

export default VerificacionR;