import React, { useState } from "react";
import { Search, CheckCircle, XCircle, X } from "lucide-react";

function VerificacionR() {
  const [rfc, setRfc] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ 
    type: '', 
    title: '', 
    message: '', 
    showConfirm: false, 
    onConfirm: null 
  });

  // Simulación de lista negra del SAT - Usa este RFC para probar la alerta roja: XAXX010101000
  const listaNegraSAT = [
    "XAXX010101000"  // Este RFC mostrará la alerta de lista negra
  ];

  // Función para validar longitud del RFC
  const validarLongitudRFC = (rfc) => {
    return rfc.length >= 12 && rfc.length <= 13;
  };

  // Función para mostrar alertas
  const showAlert = (type, title, message, showConfirm = false, onConfirm = null) => {
    setAlertConfig({ type, title, message, showConfirm, onConfirm });
    setAlertOpen(true);
  };

  // Componente de Alertas
  const Alert = () => {
    if (!alertOpen) return null;

    const alertStyles = {
      success: { 
        bg: 'bg-green-50', 
        border: 'border-green-200', 
        icon: <CheckCircle className="w-6 h-6 text-green-600" />, 
        button: 'bg-green-600 hover:bg-green-700',
        text: 'text-green-800'
      },
      error: { 
        bg: 'bg-red-50', 
        border: 'border-red-200', 
        icon: <XCircle className="w-6 h-6 text-red-600" />, 
        button: 'bg-red-600 hover:bg-red-700',
        text: 'text-red-800'
      }
    };

    const style = alertStyles[alertConfig.type] || alertStyles.info;

    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity backdrop-blur-sm" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl shadow-2xl border-2 ${style.bg} ${style.border} w-full max-w-sm sm:max-w-md transform transition-all duration-300 scale-95 hover:scale-100`}>
            <div className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                  {style.icon}
                </div>
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

  // Función para buscar RFC
  const buscarRFC = () => {
    // Validar que el RFC no esté vacío
    if (!rfc.trim()) {
      showAlert('error', 'RFC Requerido', 'Por favor ingrese un RFC para realizar la búsqueda.');
      return;
    }

    // Validar longitud del RFC
    if (!validarLongitudRFC(rfc)) {
      showAlert('error', 'Longitud Inválida', 'El RFC debe tener entre 12 y 13 caracteres.');
      return;
    }

    // Simular búsqueda en lista negra
    const rfcNormalizado = rfc.toUpperCase();
    const estaEnListaNegra = listaNegraSAT.includes(rfcNormalizado);

    // Mostrar resultado
    if (estaEnListaNegra) {
      showAlert(
        'error', 
        'RFC No Aceptado', 
        'Identificado en la lista de NO LOCALIZADOS publicada por el SAT'
      );
    } else {
      showAlert(
        'success', 
        'RFC Aceptado', 
        'No se encuentra en el listado Art. 64 CFF publicado por el SAT\nNo está en la lista de EFOS publicada por el SAT'
      );
    }
  };

  // Manejar tecla Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      buscarRFC();
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-beige min-h-screen">
      <div className="max-w-2xl lg:max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-darkBlue mb-3 sm:mb-4">
            Verificación de RFC
          </h1>
          <p className="text-midBlue text-base sm:text-lg lg:text-xl">
            Consulta de proveedores en lista negra del SAT
          </p>
        </div>

        {/* Panel de búsqueda */}
        <div className="bg-white rounded-lg sm:rounded-xl border-2 border-lightBlue p-4 sm:p-6 lg:p-8 shadow-lg">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-darkBlue mb-2">
              Consulta de RFC
            </h2>
            <p className="text-midBlue text-sm sm:text-base">
              Ingresa el RFC del proveedor para verificar si se encuentra en la lista negra del SAT
            </p>
          </div>

          {/* Campo de búsqueda */}
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
                />
              </div>
            </div>

            {/* Botón de búsqueda */}
            <button
              onClick={buscarRFC}
              disabled={!rfc.trim()}
              className="w-full bg-midBlue text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-darkBlue transition duration-200 font-medium disabled:bg-lightBlue disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              Verificar RFC
            </button>
          </div>
        </div>

        {/* Nota para testing */}
        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-midBlue text-xs sm:text-sm">
            <strong>Para probar:</strong> Ingresa <code className="bg-lightBlue px-1 rounded">XAXX010101000</code> para ver alerta de lista negra
          </p>
        </div>
      </div>

      {/* Alertas */}
      <Alert />
    </div>
  );
}

export default VerificacionR;